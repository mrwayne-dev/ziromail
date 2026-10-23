#!/usr/bin/env node
/*
 * Playwright + axe-core sweep.
 *
 * Visits every page in `pages.mjs` at 390 and 1440, injects axe-core, and
 * reports the WCAG 2.1 AA violations the ops redesign and the dashboard +
 * webmail design pass are both contracted to clear. Writes a JSON report, a
 * markdown summary, and a screenshot per page per viewport under `runs/<id>/`.
 *
 * Prerequisites — see ./README.md.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { DASHBOARD_PAGES, OPS_PAGES, VIEWPORTS, WEBMAIL_PAGES } from './pages.mjs';
import { totp } from './totp.mjs';

const config = {
    baseUrl: process.env.SWEEP_BASE_URL ?? 'https://ziroemail.test',
    ownerEmail: process.env.SWEEP_OWNER_EMAIL ?? 'owner@sweep.test',
    ownerPassword: process.env.SWEEP_OWNER_PASSWORD ?? 'BrowserSweep123!',
    staffEmail: process.env.SWEEP_STAFF_EMAIL ?? 'ops@sweep.test',
    staffPassword: process.env.SWEEP_STAFF_PASSWORD ?? 'BrowserSweep123!',
    totpSecret: process.env.SWEEP_TOTP_SECRET ?? 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
    outDir: process.env.SWEEP_OUT_DIR ?? path.join('runs', new Date().toISOString().replace(/[:.]/g, '-')),
    ignoreHttpsErrors: (process.env.SWEEP_IGNORE_HTTPS ?? 'true') === 'true',
    // axe rules we deliberately skip; add here with a one-line reason.
    disableRules: [],
};

async function signInOwner(context) {
    const page = await context.newPage();
    await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill(config.ownerEmail);
    await page.locator('input[name="password"]').fill(config.ownerPassword);
    await page.locator('form').getByRole('button', { name: /sign in|continue|log in/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    await page.close();
}

async function signInStaff(context) {
    const page = await context.newPage();
    await page.goto(`${config.baseUrl}/ops/login`, { waitUntil: 'networkidle' });
    await page.locator('input[name="email"]').fill(config.staffEmail);
    await page.locator('input[name="password"]').fill(config.staffPassword);
    await page.locator('form').getByRole('button', { name: /sign in|continue|log in/i }).click();
    await page.waitForURL(/\/ops\/login\/two-factor/, { timeout: 15_000 });
    const code = totp(config.totpSecret);
    await page.locator('input[name="code"], input[name="totp"], input[inputmode="numeric"]').first().fill(code);
    await page.locator('form').getByRole('button', { name: /verify|continue|sign in|submit/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/ops/login'), { timeout: 15_000 });
    await page.close();
}

/*
 * Pulls the Inertia page object off the server-rendered HTML. Inertia 3 emits a
 * `<script data-page="app" type="application/json">{page JSON}</script>` tag
 * near the end of the body; we read the raw response rather than wait for the
 * page to hydrate (React removes the tag after mount).
 */
async function inertiaPage(context, url) {
    const response = await context.request.get(url);
    if (response.status() >= 400) return null;
    const html = await response.text();
    const match = html.match(/<script[^>]*data-page=["']app["'][^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
}

async function fetchSweepIds(context) {
    const data = await inertiaPage(context, `${config.baseUrl}/dashboard/mailboxes`);
    const mbxs = data?.props?.mailboxes ?? [];
    const dom = data?.props?.domain;
    const first = mbxs[0] ?? {};
    return { mailboxId: first.id ?? first.ulid, domainId: dom?.id };
}

async function fetchOpsIds(context) {
    const flagsData = await inertiaPage(context, `${config.baseUrl}/ops/abuse`);
    const first = flagsData?.props?.flags?.[0] ?? flagsData?.props?.waiting?.[0] ?? flagsData?.props?.queue?.[0];
    const usersData = await inertiaPage(context, `${config.baseUrl}/ops/users`);
    const firstOwner = usersData?.props?.users?.[0] ?? usersData?.props?.rows?.[0];
    return { abuseFlagId: first?.id ?? null, ownerUserId: firstOwner?.id ?? null };
}

async function sweepPage(context, entry, ids) {
    const pathStr = entry.path(ids);
    if (/\/(undefined|null)(\/|$|\?)/.test(pathStr)) {
        return [{ page: entry.label, viewport: '-', url: pathStr, status: 0, error: 'seeded id did not resolve; skipped', violations: [] }];
    }
    const url = `${config.baseUrl}${pathStr}`;
    const results = [];
    for (const viewport of VIEWPORTS) {
        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        try {
            // `domcontentloaded` instead of `networkidle`: Reverb's socket retries keep the
            // network busy on preview and dev, and the sweep does not need a quiet socket.
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            const status = response?.status() ?? 0;
            if (status >= 400) {
                results.push({ page: entry.label, viewport: viewport.label, url, status, error: `HTTP ${status}`, violations: [] });
                continue;
            }
            if (entry.main) {
                await page.waitForSelector(entry.main, { state: 'attached', timeout: 15_000 });
            }
            // Give row-staggers and lazy images a beat to settle before axe scans.
            await page.waitForTimeout(400);
            const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
            if (config.disableRules.length) builder.disableRules(config.disableRules);
            const axe = await builder.analyze();
            const shot = path.join(config.outDir, 'shots', `${viewport.label}-${entry.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`);
            await mkdir(path.dirname(shot), { recursive: true });
            await page.screenshot({ path: shot, fullPage: true });
            results.push({
                page: entry.label,
                viewport: viewport.label,
                url,
                status,
                violations: axe.violations.map((v) => ({
                    id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
                    nodeTargets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
                })),
                screenshot: shot,
            });
        } catch (error) {
            results.push({ page: entry.label, viewport: viewport.label, url, status: 0, error: String(error), violations: [] });
        } finally {
            await page.close();
        }
    }
    return results;
}

function summarise(results) {
    const violations = [];
    for (const r of results) {
        for (const v of (r.violations ?? [])) {
            violations.push({ ...v, page: r.page, viewport: r.viewport, url: r.url });
        }
    }
    const total = violations.length;
    const byImpact = violations.reduce((acc, v) => (acc[v.impact ?? 'unknown'] = (acc[v.impact ?? 'unknown'] ?? 0) + 1, acc), {});
    const errors = results.filter((r) => r.error);
    return { pagesSwept: results.length, total, byImpact, errors: errors.map((r) => ({ page: r.page, viewport: r.viewport, url: r.url, error: r.error })), violations };
}

function markdown(summary) {
    const lines = [
        '# Axe sweep report',
        '',
        `Base URL: ${config.baseUrl}`,
        `Pages × viewports: ${summary.pagesSwept}`,
        `Total violations: **${summary.total}**`,
        `By impact: ${JSON.stringify(summary.byImpact)}`,
        '',
    ];
    if (summary.errors.length) {
        lines.push('## Pages that could not be scanned');
        for (const e of summary.errors) {
            lines.push(`- ${e.page} (${e.viewport}) — ${e.url}: ${e.error}`);
        }
        lines.push('');
    }
    if (summary.total === 0) {
        lines.push('No violations.');
        return lines.join('\n');
    }
    lines.push('## Violations');
    const grouped = {};
    for (const v of summary.violations) {
        (grouped[v.id] ??= []).push(v);
    }
    for (const [id, hits] of Object.entries(grouped)) {
        lines.push(`### ${id} — ${hits[0].help}`);
        for (const v of hits) {
            lines.push(`- ${v.page} (${v.viewport}): ${v.nodes} nodes, e.g. \`${v.nodeTargets.join('`, `')}\``);
        }
    }
    return lines.join('\n');
}

async function main() {
    await mkdir(config.outDir, { recursive: true });

    const browser = await chromium.launch();
    const ownerContext = await browser.newContext({ ignoreHTTPSErrors: config.ignoreHttpsErrors });
    const staffContext = await browser.newContext({ ignoreHTTPSErrors: config.ignoreHttpsErrors });

    console.log('[sweep] signing in owner...');
    await signInOwner(ownerContext);
    console.log('[sweep] signing in staff...');
    await signInStaff(staffContext);

    console.log('[sweep] resolving seeded ids...');
    const ownerIds = await fetchSweepIds(ownerContext);
    const opsIds = await fetchOpsIds(staffContext);
    const ids = { ...ownerIds, ...opsIds };
    console.log('[sweep] ids:', ids);

    const all = [];
    for (const entry of [...DASHBOARD_PAGES, ...WEBMAIL_PAGES]) {
        process.stdout.write(`[sweep] ${entry.label} ... `);
        const r = await sweepPage(ownerContext, entry, ids);
        all.push(...r);
        console.log(`${r.map((x) => x.violations?.length ?? '?').join('/')} violations across viewports`);
    }
    for (const entry of OPS_PAGES) {
        process.stdout.write(`[sweep] ${entry.label} ... `);
        const r = await sweepPage(staffContext, entry, ids);
        all.push(...r);
        console.log(`${r.map((x) => x.violations?.length ?? '?').join('/')} violations across viewports`);
    }

    const summary = summarise(all);
    await writeFile(path.join(config.outDir, 'report.json'), JSON.stringify({ config: { ...config, ownerPassword: '[hidden]', staffPassword: '[hidden]', totpSecret: '[hidden]' }, ids, results: all, summary }, null, 2));
    await writeFile(path.join(config.outDir, 'report.md'), markdown(summary));

    console.log(`\n[sweep] done. ${summary.total} violation(s) across ${summary.pagesSwept} page/viewport runs.`);
    console.log(`[sweep] report: ${path.join(config.outDir, 'report.md')}`);
    await browser.close();
    process.exit(summary.total === 0 && summary.errors.length === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error(error);
    process.exit(2);
});

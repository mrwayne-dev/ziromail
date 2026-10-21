import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PoolAllocator, { checkAllocation } from '../../Components/domain/PoolAllocator';
import Button from '../../Components/ui/Button';
import AsideCards from '../../Components/ui/AsideCards';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { plansFixture } from '../../fixtures/plans';
import { quotaOf, rowsFromFixture } from '../../Lib/onboarding';
import { route } from '../../Lib/route';

const asides = [
    {
        title: 'There is no seat limit',
        body: 'Create as many mailboxes as you like. The pool is the only limit. Ten people sharing 30 GB is fine if their quotas add up.',
    },
    {
        title: 'Start small',
        body: 'Give each person a little less than you think. Raising a quota takes two seconds later; you cannot lower one below what a mailbox already holds.',
    },
    {
        title: 'Leave some unassigned',
        body: 'Storage you do not hand out stays in the pool, ready for a new hire or a mailbox that fills faster than expected.',
    },
    {
        title: 'Shared addresses cost nothing',
        body: 'An address like info@ that just forwards into an existing mailbox is not a mailbox and uses no storage of its own. Add those from the dashboard afterwards.',
    },
];

export default function Mailboxes() {
    const { domain, domainId, plan, carry } = useOnboarding();
    const { existing, errors } = usePage().props;
    const [rows, setRows] = useState(() => rowsFromFixture(onboardingFixture.mailboxes.initial));
    const [showErrors, setShowErrors] = useState(false);
    const [saving, setSaving] = useState(false);
    const freeGb = Math.round((plan.poolGb - existing.reduce((sum, row) => sum + row.quotaGb, 0)) * 10) / 10;
    const { over, errors: rowErrors } = checkAllocation(rows, freeGb);
    const serverError = Object.entries(errors).find(([key]) => key.startsWith('rows'))?.[1];
    const alreadyMade = existing.length > 0;

    function onSubmit(e) {
        e.preventDefault();
        if (over || Object.keys(rowErrors).length > 0) {
            setShowErrors(true);
            return;
        }
        const payload = rows.map((row) => ({ local_part: row.local.trim().toLowerCase(), quota_gb: quotaOf(row) }));
        router.post(route('onboarding.mailboxes.store'), { domain: domainId, rows: payload }, {
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
        });
    }

    return (
        <>
            <Seo title="Create your mailboxes | Ziroemail" description="Divide your storage pool between your first mailboxes." path="/onboarding/mailboxes" noindex />

            <div className="ob-grid ob-grid-wide">
                <form onSubmit={onSubmit} noValidate>
                    <div data-hero>
                        <h1>Create your first mailboxes</h1>
                        <p className="lead">
                            Your {plan.name} plan gives <span className="mono">{domain}</span> a pool of <b className="strong">{plan.poolGb}&nbsp;GB</b>. Divide it however suits you. You can change any of this later.
                        </p>
                    </div>

                    {alreadyMade && (
                        <p className="hint">This domain already has {existing.length} {existing.length === 1 ? 'mailbox' : 'mailboxes'}. Anything you add here is on top of {existing.length === 1 ? 'it' : 'them'}. <Link href={route('onboarding.done', carry())}>Skip to the summary</Link>.</p>
                    )}
                    {serverError && <p className="hint hint-bad" role="alert">{serverError}</p>}

                    <PoolAllocator
                        rows={rows}
                        onChange={setRows}
                        poolGb={freeGb}
                        domain={domain}
                        planLabel={`${plan.name} · expandable to ${plan.ceilingGb ?? plan.poolGb} GB`}
                        extraBlockGb={plansFixture.extraStorage.blockGb}
                        step={onboardingFixture.mailboxes.step}
                        showErrors={showErrors}
                    />

                    <div className="btn-row ob-actions">
                        <Button type="submit" size="lg" disabled={over} busy={saving}>Create these mailboxes</Button>
                        <Button variant="line" size="lg" href={route('onboarding.records', carry())}>Back to records</Button>
                    </div>
                </form>

                <AsideCards items={asides} />
            </div>
        </>
    );
}

Mailboxes.layout = (page) => <OnboardingLayout step="mailboxes">{page}</OnboardingLayout>;

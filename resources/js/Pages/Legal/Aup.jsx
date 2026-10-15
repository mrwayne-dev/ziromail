import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Aup() {
    return (
        <>
            <Seo title="Acceptable use policy — Ziroemail"
                description="What you may and may not do with a Ziroemail account, and what happens if a line is crossed."
                path="/legal/aup"
                ogDescription="What you may and may not do with a Ziroemail account, stated plainly and in advance." />

            <nav className="legal-nav" aria-label="Legal documents">
              <Link href={route('legal.terms')}>
                Terms of service
              </Link>
              {' '}
              <Link href={route('legal.privacy')}>
                Privacy policy
              </Link>
              {' '}
              <Link href={route('legal.aup')} aria-current="page">
                Acceptable use
              </Link>
              {' '}
              <Link href={route('legal.refunds')}>
                Refund policy
              </Link>
            </nav>
            <article className="doc">
              <h1>Acceptable use policy</h1>
              <p className="meta">Last updated 29 September 2026 · Zirostack Ltd, Port Harcourt, Rivers State</p>
              <p className="intro">
                One compromised mailbox sending junk can get an entire mail server blocked, which means every other customer's invoices stop arriving. That is why this policy exists and why we enforce it quickly. It is stated plainly and in advance so nothing here is a surprise.
              </p>
              <h2>What you must not send</h2>
              <ul>
                <li>Unsolicited bulk email of any kind, including to lists you bought or scraped.</li>
                <li>Phishing, fraud, or messages impersonating another person or organisation.</li>
                <li>Malware, or links to it.</li>
                <li>Content that is illegal under Nigerian law.</li>
                <li>Harassment or threats directed at anyone.</li>
              </ul>
              <h2>Bulk and marketing email</h2>
              <p>
                Ziroemail is for business correspondence. It is not a mailing-list platform, and sending campaigns from it is the fastest way to get our sending addresses blocked. If you need to send newsletters, use a service built for it — we are happy to point you at one.
              </p>
              <h2>Sending limits</h2>
              <p>
                Every account has hourly and daily sending limits appropriate to its plan. These exist to contain damage from a compromised mailbox, not to restrict normal business use. If you legitimately need more, tell us and we will look at it.
              </p>
              <h2>What we watch for</h2>
              <p>
                We monitor for sudden changes in sending behaviour, bounce rates and complaint rates. An account that suddenly sends far above its own normal pattern is locked automatically and flagged for review.
              </p>
              <p>
                This is deliberately aggressive. A locked account is an inconvenience; a blocklisted server is an outage for everyone.
              </p>
              <h2>What happens if something is wrong</h2>
              <p>Our response is proportionate to what we find:</p>
              <ul>
                <li>
                  <b>Suspected compromise</b>
                  {' '}
                  — we lock sending, contact you, and help you secure the mailbox. Receiving continues.
                </li>
                <li>
                  <b>A mistake</b>
                  {' '}
                  — we tell you what we saw and what needs to change.
                </li>
                <li>
                  <b>Deliberate abuse</b>
                  {' '}
                  — we suspend the account and may terminate it.
                </li>
              </ul>
              <p>
                We will always tell you what we found and why we acted. Where the cause is fixed, access is restored.
              </p>
              <h2>Reporting abuse</h2>
              <p>
                If you have received spam or a phishing message from a Ziroemail address, send it to
                {' '}
                <span className="mono">abuse@ziroemail.com</span>
                {' '}
                with full headers. We investigate these promptly — it protects everyone's delivery, including yours.
              </p>
              <div className="note" style={{ marginTop: "44px" }}>
                <h4>Questions about this document</h4>
                <p>
                  Email
                  {' '}
                  <span className="mono">legal@ziroemail.com</span>
                  {' '}
                  or
                  {' '}
                  <Link href={route('contact')}>
                    message us
                  </Link>
                  . We would rather explain a clause than have you agree to something you do not understand.
                </p>
              </div>
            </article>
        </>
    );
}

Aup.layout = (page) => (
    <PublicLayout variant="light" page="legal" mainClass="wrap legal">{page}</PublicLayout>
);

import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Refunds() {
    return (
        <>
            <Seo title="Refund policy — Ziroemail"
                description="When Ziroemail refunds, how much, and how long it takes. Full refund within 14 days, unused whole months after that, and credit for outages without asking."
                path="/legal/refunds"
                ogDescription="When we refund, how much, and how long it takes." />

            <nav className="legal-nav" aria-label="Legal documents">
              <Link href={route('legal.terms')}>
                Terms of service
              </Link>
              {' '}
              <Link href={route('legal.privacy')}>
                Privacy policy
              </Link>
              {' '}
              <Link href={route('legal.aup')}>
                Acceptable use
              </Link>
              {' '}
              <Link href={route('legal.refunds')} aria-current="page">
                Refund policy
              </Link>
            </nav>
            <article className="doc">
              <h1>Refund policy</h1>
              <p className="meta">Last updated 29 September 2026 · Zirostack Ltd, Port Harcourt, Rivers State</p>
              <p className="intro">
                Refunds are calculated by this policy, not by argument. It is written to be specific enough that you can work out your own position before contacting us.
              </p>
              <h2>The first 14 days</h2>
              <p>
                If you are not satisfied within 14 days of your first payment for a domain, tell us and we will refund it in full. You do not need to give a reason.
              </p>
              <p>This applies once per domain, to a first purchase — not to renewals.</p>
              <h2>Cancelling mid-term</h2>
              <p>
                You can cancel at any time. Cancelling stops the next renewal and your service runs to the end of the period you have paid for.
              </p>
              <p>
                For yearly plans cancelled after the first 14 days, we refund the unused whole months, less any month in progress. A yearly plan cancelled after four and a half months refunds seven months.
              </p>
              <p>
                Monthly plans are not refunded mid-month; the service simply runs to the end of that month.
              </p>
              <h2>Extra storage</h2>
              <p>
                Storage blocks follow the plan they were bought against. If you cancel a plan mid-term, any blocks on it are refunded on the same unused-whole-months basis.
              </p>
              <h2>If we get it wrong</h2>
              <p>
                If we suffer a sustained outage that materially affects your service, we will credit or refund the affected period without you having to ask — we can see the same status data you can. If you think we have missed one, tell us and we will look.
              </p>
              <h2>When we do not refund</h2>
              <ul>
                <li>Accounts terminated for breach of the acceptable use policy.</li>
                <li>Migration work that has already run and moved your mail across.</li>
                <li>Periods where the service was available and working as described.</li>
              </ul>
              <h2>How to request one</h2>
              <p>
                Message us on WhatsApp or email
                {' '}
                <span className="mono">billing@ziroemail.com</span>
                {' '}
                from the account owner's address. We will confirm the calculation with you before processing it.
              </p>
              <p>
                Refunds go back by the route you paid. Bank transfers usually clear within 3–5 working days; card refunds can take up to 10, which is the card network's timing rather than ours.
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

Refunds.layout = (page) => (
    <PublicLayout variant="light" page="legal" mainClass="wrap legal">{page}</PublicLayout>
);

import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Privacy() {
    return (
        <>
            <Seo title="Privacy policy — Ziroemail"
                description="What personal data Ziroemail holds, why we hold it, and what rights you have over it."
                path="/legal/privacy"
                ogDescription="What personal data we hold, why, who else processes it, and your rights over it." />

            <nav className="legal-nav" aria-label="Legal documents">
              <Link href={route('legal.terms')}>
                Terms of service
              </Link>
              {' '}
              <Link href={route('legal.privacy')} aria-current="page">
                Privacy policy
              </Link>
              {' '}
              <Link href={route('legal.aup')}>
                Acceptable use
              </Link>
              {' '}
              <Link href={route('legal.refunds')}>
                Refund policy
              </Link>
            </nav>
            <article className="doc">
              <h1>Privacy policy</h1>
              <p className="meta">Last updated 29 September 2026 · Zirostack Ltd, Port Harcourt, Rivers State</p>
              <p className="intro">
                We are holding your business correspondence, which is about as private as data gets. This explains exactly what we hold, why, who else can see it, and what you can ask us to do about it.
              </p>
              <h2>Who we are</h2>
              <p>
                Zirostack Ltd, of Port Harcourt, Rivers State, Nigeria, is the data controller for the Ziroemail service. We process personal data under the Nigeria Data Protection Act.
              </p>
              <h2>What we hold</h2>
              <h3>Account data</h3>
              <p>
                Business name, the name and email address of the account owner, a WhatsApp number for support and service notices, and billing details. We need this to provide the service and to invoice you.
              </p>
              <h3>Mailbox content</h3>
              <p>
                The messages, attachments, folders and contacts in your mailboxes. We hold this only to deliver the service.
                {' '}
                <b>We do not read it, scan it for advertising, or use it to train any model.</b>
              </p>
              <h3>Technical logs</h3>
              <p>
                Connection records, delivery logs and security events. These are how we diagnose delivery problems and detect compromised accounts. Delivery logs are kept for 90 days; security logs for 12 months.
              </p>
              <h2>Why we hold it</h2>
              <ul>
                <li>
                  <b>To provide the service</b>
                  {' '}
                  — performing our contract with you.
                </li>
                <li>
                  <b>To protect the service</b>
                  {' '}
                  — our legitimate interest in preventing abuse, which protects every other customer's delivery.
                </li>
                <li>
                  <b>To meet legal obligations</b>
                  {' '}
                  — tax records and lawful requests.
                </li>
              </ul>
              <h2>Who else processes it</h2>
              <p>
                We use a small number of processors, each bound by contract. We publish this list because being a Nigerian company does not by itself mean your data stays in Nigeria.
              </p>
              <ul>
                <li>
                  <b>Amazon Web Services</b>
                  {' '}
                  — outbound mail relay. Stockholm region.
                </li>
                <li>
                  <b>Paystack</b>
                  {' '}
                  — payment processing. Nigeria. Card details never reach our servers.
                </li>
                <li>
                  <b>Our hosting provider</b>
                  {' '}
                  — the servers your mail lives on.
                </li>
              </ul>
              <p>We do not sell your data, and we do not share it for advertising.</p>
              <h2>How long we keep it</h2>
              <p>
                Mailbox content stays until you delete it or close your account. After closure we hold it for 30 days in case of error, then delete it. Invoices are kept for the period Nigerian tax law requires.
              </p>
              <h2>Your rights</h2>
              <p>
                You can ask us to give you a copy of your data, correct it, delete it, or stop a particular use of it. Mail export is self-service and available at any time without asking. For anything else, email
                {' '}
                <span className="mono">privacy@ziroemail.com</span>
                {' '}
                and we will respond within 30 days.
              </p>
              <h2>Security</h2>
              <p>
                Traffic is encrypted in transit, storage and backups are encrypted at rest, backups are held under separate credentials, and administrative access to customer data is logged and reviewable. Two-factor authentication is available to every user and enforced for owners.
              </p>
              <h2>If something goes wrong</h2>
              <p>
                We have a written breach procedure. If a breach affects your data we will tell you what happened, what it affected, and what we are doing about it — and we will notify the Nigeria Data Protection Commission within the required window.
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

Privacy.layout = (page) => (
    <PublicLayout variant="light" page="legal" mainClass="wrap legal">{page}</PublicLayout>
);

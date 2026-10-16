import { Link } from '@inertiajs/react';
import LegalDoc from '../../Components/domain/LegalDoc';
import Seo from '../../Components/seo/Seo';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Terms() {
    return (
        <>
            <Seo title="Terms of service | Ziroemail"
                description="The agreement between your business and Zirostack Ltd for the Ziroemail service."
                path="/legal/terms" />

            <LegalDoc
              current="legal.terms"
              title="Terms of service"
              meta="Last updated 29 September 2026 · Zirostack Ltd, Port Harcourt, Rivers State"
              intro="This is the agreement between your business and Zirostack Ltd for the use of Ziroemail. It is written to be read, not to be skimmed past: if a clause does not make sense, ask us before you accept it."
            >
              <h2>1. What we provide</h2>
              <p>
                Ziroemail is business email hosting on a domain you own. A plan covers one domain and provides a storage pool you divide between mailboxes as you choose. We provide the mail servers, the webmail interface, the administration dashboard, filtering, backups and support.
              </p>
              <p>
                We do not provide bulk or marketing email sending, and accounts found using the service that way will be suspended under the acceptable use policy.
              </p>
              <h2>2. Your account</h2>
              <p>
                You must prove control of the domain before any mailbox is created. You are responsible for the accuracy of the details you give us and for what happens under your account.
              </p>
              <ul>
                <li>Keep your password private and enable two-factor authentication.</li>
                <li>Tell us promptly if you believe an account has been compromised.</li>
                <li>You are responsible for the conduct of every mailbox on your domain.</li>
              </ul>
              <h2>3. Payment</h2>
              <p>
                Plans are billed per domain, monthly or yearly, in advance. Prices exclude VAT, which is charged at 7.5% as required in Nigeria. Extra storage blocks are billed alongside the plan and renew with it.
              </p>
              <p>
                If a payment fails we will remind you before the renewal date and again after. Your mail continues working through a grace period. Only then do we suspend sending, and suspension always comes before any deletion.
              </p>
              <h3>Price reviews</h3>
              <p>
                Our infrastructure costs are denominated in dollars while you pay in naira. We may review prices at renewal and will give you written notice before any change applies. We will not change the price of a term you have already paid for.
              </p>
              <h2>4. Availability</h2>
              <p>
                We aim for 99.9% availability and publish our record on the status page. We will give notice of planned maintenance where we reasonably can, and we schedule it outside Nigerian working hours where possible.
              </p>
              <h2>5. Your data</h2>
              <p>
                Your mail is yours. We do not read it, mine it, or use it to train anything. We access mailbox content only where you ask us to for support, or where we are legally required to.
              </p>
              <p>
                You can export all of your mail at any time, on any plan, without asking us. If you leave, we keep your data for 30 days in case you change your mind, then delete it.
              </p>
              <h2>6. Suspension and termination</h2>
              <p>
                We may suspend an account or a single mailbox where there is evidence of compromise, abuse, or non-payment after the grace period. Where the cause is abuse we will tell you what we found, and we will restore access once it is resolved.
              </p>
              <p>
                You may cancel at any time. We do not lock you into a term you no longer want. See the refund policy for what happens to the remainder.
              </p>
              <h2>7. Liability</h2>
              <p>
                We provide the service with reasonable skill and care. We are not liable for indirect or consequential loss, including lost business or lost profit. Our total liability in any twelve-month period is limited to the amount you paid us in that period.
              </p>
              <p>Nothing in these terms limits liability that cannot lawfully be limited.</p>
              <h2>8. Changes</h2>
              <p>
                We may update these terms. Where a change materially affects you we will give notice by email before it takes effect, and the date at the top of this page always reflects the current version.
              </p>
              <h2>9. Governing law</h2>
              <p>
                This agreement is governed by the laws of the Federal Republic of Nigeria, and the courts of Rivers State have jurisdiction over any dispute.
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
            </LegalDoc>
        </>
    );
}

Terms.layout = (page) => (
    <PublicLayout variant="float" page="legal">{page}</PublicLayout>
);

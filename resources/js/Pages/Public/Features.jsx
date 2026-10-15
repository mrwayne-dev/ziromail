import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Shape from '../../Components/craft/Shape';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Features() {
    return (
        <>
            <Seo title="Features — Ziroemail"
                description="What Ziroemail gives your business: mail that reaches the inbox, storage you divide yourself, phones that set themselves up, and support from people."
                path="/features"
                ogTitle="Features — Ziroemail business email"
                ogDescription="Authentication set up for you, storage you divide yourself, automatic phone setup, filtering, backups and WhatsApp support. Included on every plan." />

            <section className="f-hero">
              <Shape variant="ring" className="fh1" />
              <div className="wrap" data-hero="">
                <span className="eyebrow" style={{ marginBottom: "20px", display: "block" }}>Features</span>
                <h1>Everything a business needs from its email.</h1>
                <p className="lead">
                  No add-on tiers for the basics. Authentication, filtering, backups, device setup and support are in every plan — because email without them is not really email.
                </p>
              </div>
            </section>
            {/* ===== FEATURE ROWS ===== */}
            <section className="sec">
              <div className="wrap">
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">01 — Delivery</span>
                    <h2>Mail that reaches the inbox</h2>
                  </div>
                  <div className="body">
                    <p>
                      We generate SPF, DKIM and DMARC for your exact domain, show you where to paste them, and verify them ourselves. Your mailboxes do not go live until all four records pass — stricter than most providers, deliberately.
                    </p>
                    <p>
                      After that we keep watching. If somebody edits your DNS months later and breaks a record, you hear about it from us before your customers notice.
                    </p>
                    <ul className="ticks">
                      <li>
                        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Records written for your domain, not a generic template</span>
                      </li>
                      <li>
                        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Outbound sending monitored for spikes and abuse</span>
                      </li>
                      <li>
                        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Ongoing checks against the major blocklists</span>
                      </li>
                    </ul>
                  </div>
                </Reveal>
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">02 — Storage</span>
                    <h2>One pool, divided your way</h2>
                  </div>
                  <div className="body">
                    <p>
                      Your plan gives the domain a storage pool. You decide how it is split: twelve gigabytes for the address that keeps every invoice, half a gigabyte for a seasonal hire, nothing wasted on mailboxes that barely receive.
                    </p>
                    <p>
                      Change the split whenever you like. Run low and add a 10 GB block, which joins the pool immediately at the same price on every plan.
                    </p>
                    <Link className="tlink mt" href={route('pricing')}>
                      How storage is priced
                      {' '}
                      <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                        <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </Reveal>
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">03 — Devices</span>
                    <h2>Phones that set themselves up</h2>
                  </div>
                  <div className="body">
                    <p>
                      Add a staff member, send them a link on WhatsApp, and they tap once. iPhone installs a signed configuration profile; Android gets pre-filled guided steps. Nothing typed, nothing dictated over the phone.
                    </p>
                    <p>
                      Outlook and Apple Mail find their own settings through autodiscover. The dashboard shows you whether each mailbox has actually connected from a device.
                    </p>
                  </div>
                </Reveal>
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">04 — Safety</span>
                    <h2>Filtering, backups and locks</h2>
                  </div>
                  <div className="body">
                    <p>
                      Spam, phishing and malware filtering on everything inbound, with quarantine you can release from yourself. Two-factor login on any mailbox, enforced for owners.
                    </p>
                    <p>
                      Encrypted backups leave the server daily under separate credentials, and the restore is tested — not assumed.
                    </p>
                  </div>
                </Reveal>
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">05 — Control</span>
                    <h2>An admin surface that is actually usable</h2>
                  </div>
                  <div className="body">
                    <p>
                      Create mailboxes, reset a staff password, move storage between people, add a shared address like
                      {' '}
                      <span className="mono">info@</span>
                      , or hand an agency delegated access you can withdraw in one click.
                    </p>
                    <p>
                      Everything that matters is logged: who created what, who changed a quota, who exported data.
                    </p>
                  </div>
                </Reveal>
                <Reveal className="frow">
                  <div>
                    <span className="frow-k">06 — Support</span>
                    <h2>People who answer</h2>
                  </div>
                  <div className="body">
                    <p>
                      WhatsApp support from the team that runs the servers, not a ticket queue in another time zone. Setup runs on its own, so most people never need us at all — and when something does break, you get somebody who knows the system.
                    </p>
                    <p>
                      Uptime and incidents are published on a status page hosted away from our own infrastructure, so it still loads on the day we are the problem.
                    </p>
                  </div>
                </Reveal>
              </div>
            </section>
            {/* ===== SPEC GRID ===== */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">The details</span>
                  <h2>Included on every plan</h2>
                </Reveal>
                <Reveal stagger className="spec">
                  <div className="spec-i">
                    <h4>Your own domain</h4>
                    <p>Unlimited mailboxes and shared addresses on the name you already own.</p>
                  </div>
                  <div className="spec-i">
                    <h4>IMAP & SMTP</h4>
                    <p>Works with Outlook, Apple Mail, Thunderbird and the Gmail app.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Webmail</h4>
                    <p>Built for a phone browser first, not a desktop app shrunk down.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Search</h4>
                    <p>Across sender, subject, body and attachment names.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Aliases & forwarding</h4>
                    <p>Extra addresses that deliver into an existing mailbox, not billed separately.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Out-of-office</h4>
                    <p>Auto-replies with a date range, set per mailbox.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Two-factor login</h4>
                    <p>Available to everyone, enforced for owners and administrators.</p>
                  </div>
                  <div className="spec-i">
                    <h4>Export</h4>
                    <p>Take all your mail with you whenever you want. Documented, self-service.</p>
                  </div>
                </Reveal>
                <div className="note note-warn mt-l">
                  <h4>What we do not offer</h4>
                  <p>
                    No bulk or marketing email — it is the fastest way to get a mail server blocked, and protecting delivery for everyone else matters more than that sale. There is no built-in calendar screen yet either, though calendars work through your phone's own calendar app.
                  </p>
                </div>
              </div>
            </section>
            {/* ===== CLOSE ===== */}
            <section className="sec bg-ink center">
              <div className="wrap wrap-tight">
                <h2>See it on your own domain</h2>
                <p className="lead mt">
                  Connect your domain, add your staff, and have every phone working before you close for the day.
                </p>
                <div className="btn-row center mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('signup')}>
                    Get started
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('pricing')}>
                    See pricing
                  </Link>
                </div>
              </div>
            </section>
        </>
    );
}

Features.layout = (page) => (
    <PublicLayout page="features">{page}</PublicLayout>
);

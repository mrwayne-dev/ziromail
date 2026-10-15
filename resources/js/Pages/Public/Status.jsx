import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Status() {
    return (
        <>
            <Seo title="System status — Ziroemail"
                description="Live status of Ziroemail mail delivery, webmail, dashboard and payments."
                path="/status"
                ogDescription="Live availability for mail delivery, webmail, dashboard and payments, with incident history." />

            <div className="wrap wrap-tight">
              {/* overall — reveals rather than performing an entrance, since this is
         live state a visitor is checking, not a marketing headline */}
              <Reveal dir="scale" className="banner-big" role="status">
                <span className="ic" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4.5 6.2 11.8 2.5 8.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <h1>All systems operational</h1>
                  <p>Last checked 30 seconds ago · refreshes automatically</p>
                </div>
              </Reveal>
              <p className="sm mut mt" style={{ textAlign: "center" }}>
                This page is hosted separately from Ziroemail, so it stays online even if our own servers do not.
              </p>
              {/* services */}
              <h2 style={{ fontSize: "1.2rem", marginTop: "44px" }}>Services</h2>
              <Reveal stagger className="svc mt">
                <div className="svc-row">
                  <span className="nm">
                    <b>Mail delivery</b>
                    {' '}
                    <span className="d">Sending and receiving</span>
                  </span>
                  {' '}
                  <span className="days" role="img" aria-label="90 day history: operational every day">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {' '}
                  <span className="pill pill-ok">Operational</span>
                </div>
                <div className="svc-row">
                  <span className="nm">
                    <b>Webmail</b>
                    {' '}
                    <span className="d">mail.ziroemail.com</span>
                  </span>
                  {' '}
                  <span className="days" role="img" aria-label="90 day history: one degraded day">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i className="warn" />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {' '}
                  <span className="pill pill-ok">Operational</span>
                </div>
                <div className="svc-row">
                  <span className="nm">
                    <b>Dashboard</b>
                    {' '}
                    <span className="d">Mailbox and billing administration</span>
                  </span>
                  {' '}
                  <span className="days" role="img" aria-label="90 day history: operational every day">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {' '}
                  <span className="pill pill-ok">Operational</span>
                </div>
                <div className="svc-row">
                  <span className="nm">
                    <b>Payments</b>
                    {' '}
                    <span className="d">Transfer, USSD and card</span>
                  </span>
                  {' '}
                  <span className="days" role="img" aria-label="90 day history: operational every day">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    {' '}
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {' '}
                  <span className="pill pill-ok">Operational</span>
                </div>
              </Reveal>
              <div className="days-key">
                <span>40 days ago</span>
                <span>Today</span>
              </div>
              {/* incidents */}
              <h2 style={{ fontSize: "1.2rem", marginTop: "48px" }}>Recent incidents</h2>
              <div className="inc mt">
                <Reveal dir="left" className="inc-item ok">
                  <span className="inc-when">14 MAR 2026 · RESOLVED IN 41 MINUTES</span>
                  <h3>Webmail slow to load for some customers</h3>
                  <p>
                    A database query behind the message list degraded after a routine update. Mail delivery was unaffected throughout — messages arrived normally, they were just slow to display. Rolled back and confirmed fixed.
                  </p>
                </Reveal>
                <Reveal dir="left" className="inc-item ok">
                  <span className="inc-when">2 FEB 2026 · SCHEDULED</span>
                  <h3>Planned maintenance — storage expansion</h3>
                  <p>
                    Added capacity to the mail store during a Sunday window. Sending and receiving continued throughout; webmail was read-only for eleven minutes.
                  </p>
                </Reveal>
              </div>
              <div className="note mt-l">
                <h4>How we report</h4>
                <p>
                  We post here within fifteen minutes of confirming an incident, update it at least hourly while it is open, and publish what actually went wrong once it is closed. Customers on a paid plan also get an email.
                </p>
              </div>
              <p className="center sm mut mt-l">
                Something wrong that is not listed?
                {' '}
                <Link href={route('contact')} style={{ color: "var(--blue)", fontWeight: "600" }}>
                  Tell us
                </Link>
                .
              </p>
            </div>
        </>
    );
}

Status.layout = (page) => (
    <PublicLayout variant="status" page="status" mainClass="sec-sm">{page}</PublicLayout>
);

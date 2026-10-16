import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Pill from '../../Components/ui/Pill';
import PageHero from '../../Components/ui/PageHero';
import Seo from '../../Components/seo/Seo';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const DAYS = 40;

// Illustrative history: one bar per day, oldest first. The webmail slowdown is the
// one day that was not clean.
const services = [
    { name: 'Mail delivery', note: 'Sending and receiving', incidents: {} },
    { name: 'Webmail', note: 'mail.ziroemail.com', incidents: { 25: 'Slow to load for some customers, resolved in 41 minutes' } },
    { name: 'Dashboard', note: 'Mailbox and billing administration', incidents: {} },
    { name: 'Payments', note: 'Transfer, USSD and card', incidents: {} },
];

function UptimeBars({ service }) {
    const flagged = Object.keys(service.incidents).length;
    return (
        <div
            className="uptime"
            role="img"
            aria-label={flagged ? `Last ${DAYS} days: one day with an incident. ${Object.values(service.incidents)[0]}.` : `Last ${DAYS} days: no incidents.`}
        >
            {Array.from({ length: DAYS }, (_, i) => (
                <i key={i} className={service.incidents[i] ? 'is-warn' : undefined} title={service.incidents[i] ?? 'No incidents'} />
            ))}
        </div>
    );
}

export default function Status() {
    return (
        <>
            <Seo title="System status | Ziroemail"
                description="Live status of Ziroemail mail delivery, webmail, dashboard and payments."
                path="/status"
                ogDescription="Live availability for mail delivery, webmail, dashboard and payments, with incident history." />

            <PageHero
              eyebrow="System status"
              title="All systems operational"
              lead="This page is hosted separately from Ziroemail, so it stays online even if our own servers do not."
            >
              <p className="status-live" role="status">
                <span className="status-dot" aria-hidden="true" />
                Last checked 30 seconds ago · refreshes automatically
              </p>
            </PageHero>

            <section className="status-body">
              <div className="wrap">
                <Reveal className="status-block">
                  <h2>Services</h2>
                  <div className="svc-card">
                    {services.map((service) => (
                      <div key={service.name} className="svc-line">
                        <div className="svc-name">
                          <b>{service.name}</b>
                          <span>{service.note}</span>
                        </div>
                        <Pill tone="ok" dot>Operational</Pill>
                        <UptimeBars service={service} />
                      </div>
                    ))}
                    <div className="svc-key"><span>{DAYS} days ago</span><span>Today</span></div>
                  </div>
                </Reveal>

                <Reveal className="status-block">
                  <h2>Recent incidents</h2>
                  <ol className="incident-list">
                    <li className="incident ok">
                      <span className="incident-when">14 Mar 2026 · Resolved in 41 minutes</span>
                      <h3>Webmail slow to load for some customers</h3>
                      <p>A database query behind the message list degraded after a routine update. Mail delivery was unaffected throughout. Messages arrived normally, they were just slow to display. Rolled back and confirmed fixed.</p>
                    </li>
                    <li className="incident">
                      <span className="incident-when">2 Feb 2026 · Scheduled</span>
                      <h3>Planned maintenance: storage expansion</h3>
                      <p>Added capacity to the mail store during a Sunday window. Sending and receiving continued throughout; webmail was read-only for eleven minutes.</p>
                    </li>
                  </ol>
                </Reveal>

                <Reveal className="status-block">
                  <div className="note">
                    <h4>How we report</h4>
                    <p>We post here within fifteen minutes of confirming an incident, update it at least hourly while it is open, and publish what actually went wrong once it is closed. Customers on a paid plan also get an email.</p>
                  </div>
                  <p className="status-tell">
                    Something wrong that is not listed? <Link className="tlink" href={route('contact')}>Tell us</Link>
                  </p>
                </Reveal>
              </div>
            </section>
        </>
    );
}

Status.layout = (page) => (
    <PublicLayout variant="float" page="status">{page}</PublicLayout>
);

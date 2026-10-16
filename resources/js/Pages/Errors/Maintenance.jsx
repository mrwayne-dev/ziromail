import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import SystemLayout from '../../Layouts/SystemLayout';
import { route } from '../../Lib/route';

export default function Maintenance() {
    return (
        <>
            <Seo title="Planned maintenance | Ziroemail"
                description="Ziroemail is briefly down for scheduled work."
                noindex />

            <div className="sys-card" data-hero="">
              <span className="sys-ic ic-info" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 6.6V12l3.6 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <h1>Back in about 20 minutes</h1>
              <p className="lead">
                We are carrying out planned maintenance on the dashboard. This was scheduled outside Nigerian working hours.
              </p>
              <div className="note mt-l">
                <h4>Mail is still being delivered</h4>
                <p>
                  Sending and receiving continue normally throughout. Only this interface is briefly unavailable. Nothing is queued or lost.
                </p>
              </div>
              <div className="sys-links">
                <Link href={route('status')}>
                  <span>
                    <b>Follow progress on the status page</b>
                    <span>Updated as the work completes</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {' '}
                <Link href={route('contact')}>
                  <span>
                    <b>Urgent?</b>
                    <span>Message us on WhatsApp</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <p className="sm mut mt-l" style={{ paddingTop: "22px", borderTop: "1px solid var(--line)" }}>Started 02:00 WAT · expected back by 02:30 WAT</p>
            </div>
        </>
    );
}

Maintenance.layout = (page) => <SystemLayout>{page}</SystemLayout>;

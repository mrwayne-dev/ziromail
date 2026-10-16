import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import SystemLayout from '../../Layouts/SystemLayout';
import { route } from '../../Lib/route';

function reload(e) {
    e.preventDefault();
    window.location.reload();
}

export default function ServerError() {
    return (
        <>
            <Seo title="Something went wrong | Ziroemail"
                description="An error on our side."
                noindex />

            <div className="sys-card" data-hero="">
              <span className="sys-ic ic-bad" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7v5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                  <circle cx="12" cy="16.4" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <h1>Something went wrong on our side</h1>
              <p className="lead">This is our fault, not yours. The error has been logged and we can see it.</p>
              <div className="note note-warn mt-l">
                <h4>Your mail is unaffected</h4>
                <p>
                  This page failed to load, but sending and receiving run on separate systems and keep working. Nothing has been lost.
                </p>
              </div>
              <div className="sys-links">
                <a href="#" onClick={reload}>
                  <span>
                    <b>Try again</b>
                    <span>Most of these clear on a second attempt</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                {' '}
                <Link href={route('status')}>
                  <span>
                    <b>Check system status</b>
                    <span>Hosted away from our servers, so it loads even now</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {' '}
                <Link href={route('contact')}>
                  <span>
                    <b>Tell us what you were doing</b>
                    <span>It helps us find the cause faster</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <p className="sm mut mt-l" style={{ paddingTop: "22px", borderTop: "1px solid var(--line)" }}>
                Reference
                {' '}
                <span className="mono">ERR-7F3A21</span>
                . Quote this if you contact us.
              </p>
            </div>
        </>
    );
}

ServerError.layout = (page) => <SystemLayout>{page}</SystemLayout>;

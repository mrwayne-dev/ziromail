import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import SystemLayout from '../../Layouts/SystemLayout';
import { route } from '../../Lib/route';

function reload(e) {
    e.preventDefault();
    window.location.reload();
}

export default function Offline() {
    return (
        <>
            <Seo title="No connection — Ziroemail"
                description="You are offline."
                noindex />

            <div className="sys-card" data-hero="">
              <span className="sys-ic ic-warn" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16.5a5 5 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="20" r="1.2" fill="currentColor" />
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <h1>You are offline</h1>
              <p className="lead">Your device has lost its connection. Ziroemail is almost certainly fine.</p>
              <div className="note mt-l">
                <h4>You can still read recent messages</h4>
                <p>
                  Anything you opened recently is stored on this device and remains readable. Messages you write now are saved as drafts and send themselves once you are back online.
                </p>
              </div>
              <div className="sys-links">
                <a href="#" onClick={reload}>
                  <span>
                    <b>Try again</b>
                    <span>Once your connection returns</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                {' '}
                <Link href={route('mail')}>
                  <span>
                    <b>Read what you already have</b>
                    <span>Recent messages, offline</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <p className="sm mut mt-l" style={{ paddingTop: "22px", borderTop: "1px solid var(--line)" }}>
                On mobile data? Poor signal affects loading more than it affects sending — your drafts are safe either way.
              </p>
            </div>
        </>
    );
}

Offline.layout = (page) => <SystemLayout>{page}</SystemLayout>;

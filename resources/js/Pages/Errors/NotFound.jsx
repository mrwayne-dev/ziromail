import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import SystemLayout from '../../Layouts/SystemLayout';
import { route } from '../../Lib/route';

export default function NotFound() {
    return (
        <>
            <Seo title="Page not found | Ziroemail"
                description="That page does not exist."
                noindex
                robots="noindex, follow" />

            <div className="sys-card" data-hero="">
              <span className="sys-ic ic-mut" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16.5 16.5 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <h1>We cannot find that page</h1>
              <p className="lead">
                The link may be out of date, or the address may have a typo in it. Nothing is wrong with your account.
              </p>
              <div className="sys-links">
                <Link href={route('home')}>
                  <span>
                    <b>Go to the homepage</b>
                    <span>Start again from the top</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {' '}
                <Link href={route('help')}>
                  <span>
                    <b>Search the help centre</b>
                    <span>Guides for setup, storage and delivery</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {' '}
                <Link href={route('mail')}>
                  <span>
                    <b>Open your mailbox</b>
                    <span>If you are already signed in</span>
                  </span>
                  <svg className="arr" width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <p className="sm mut mt-l" style={{ paddingTop: "22px", borderTop: "1px solid var(--line)" }}>
                Followed a link from us and landed here?
                {' '}
                <Link href={route('contact')} style={{ color: "var(--blue)", fontWeight: "600" }}>
                  Tell us
                </Link>
                . It is our mistake to fix, not yours.
              </p>
            </div>
        </>
    );
}

NotFound.layout = (page) => <SystemLayout>{page}</SystemLayout>;

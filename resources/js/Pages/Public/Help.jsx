import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Shape from '../../Components/craft/Shape';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Help() {
    return (
        <>
            <Seo title="Help centre — Ziroemail"
                description="Guides for setting up your domain, adding mailboxes, configuring phones and fixing delivery problems."
                path="/help"
                ogDescription="Guides for DNS records, phone setup, storage quotas, delivery problems and billing." />

            <section className="h-hero">
              <Shape variant="ring" className="hh1" />
              <div className="wrap" data-hero="">
                <span className="eyebrow" style={{ marginBottom: "16px", display: "block" }}>Help centre</span>
                <h1>How can we help?</h1>
                <label className="searchbar">
                  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5.2" stroke="#8A97A6" strokeWidth="1.6" />
                    <path d="m11 11 3.2 3.2" stroke="#8A97A6" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {' '}
                  <span className="sr-only">Search the help centre</span>
                  {' '}
                  <input type="search" placeholder="Search guides — DNS, phone setup, storage…" />
                </label>
              </div>
            </section>
            {/* ===== POPULAR ===== */}
            <section className="sec-sm">
              <div className="wrap">
                <h2 style={{ fontSize: "1.2rem" }}>Most read</h2>
                <Reveal stagger className="pop mt">
                  <a href="#">
                    <span className="n">01</span>
                    {' '}
                    <span>
                      <b>My mail is going to spam</b>
                      <span>The usual cause and how to check it in two minutes</span>
                    </span>
                  </a>
                  {' '}
                  <a href="#">
                    <span className="n">02</span>
                    {' '}
                    <span>
                      <b>Set up email on an iPhone</b>
                      <span>One tap with the configuration profile</span>
                    </span>
                  </a>
                  {' '}
                  <a href="#">
                    <span className="n">03</span>
                    {' '}
                    <span>
                      <b>Where do I paste the DNS records?</b>
                      <span>Step by step for the common Nigerian registrars</span>
                    </span>
                  </a>
                  {' '}
                  <a href="#">
                    <span className="n">04</span>
                    {' '}
                    <span>
                      <b>Give a mailbox more storage</b>
                      <span>Moving space around inside your pool</span>
                    </span>
                  </a>
                </Reveal>
              </div>
            </section>
            {/* ===== CATEGORIES ===== */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">Browse</span>
                  <h2>Guides by topic</h2>
                </Reveal>
                <Reveal stagger className="cats">
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M1.5 8h13M8 1.5c1.8 2 2.6 4.2 2.6 6.5S9.8 12.5 8 14.5c-1.8-2-2.6-4.2-2.6-6.5S6.2 3.5 8 1.5z" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </span>
                    <h3>Domain & DNS</h3>
                    <ul>
                      <li>
                        <a href="#">Adding your four records</a>
                      </li>
                      <li>
                        <a href="#">Fixing an SPF conflict</a>
                      </li>
                      <li>
                        <a href="#">Why records take time to appear</a>
                      </li>
                      <li>
                        <a href="#">Adding a second domain</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 9 guides →</a>
                  </div>
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <rect x="4.5" y="1.5" width="7" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M7 12.6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3>Phones & apps</h3>
                    <ul>
                      <li>
                        <a href="#">iPhone and iPad setup</a>
                      </li>
                      <li>
                        <a href="#">Android setup</a>
                      </li>
                      <li>
                        <a href="#">Outlook on a computer</a>
                      </li>
                      <li>
                        <a href="#">Manual IMAP and SMTP settings</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 7 guides →</a>
                  </div>
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <rect x="1.8" y="4" width="12.4" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M1.8 6.6h12.4" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                    <h3>Storage & mailboxes</h3>
                    <ul>
                      <li>
                        <a href="#">How the storage pool works</a>
                      </li>
                      <li>
                        <a href="#">Changing a mailbox quota</a>
                      </li>
                      <li>
                        <a href="#">Buying extra storage</a>
                      </li>
                      <li>
                        <a href="#">Creating a shared address</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 8 guides →</a>
                  </div>
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1.5 14 4v4.2c0 3.4-2.5 5.7-6 6.3-3.5-.6-6-2.9-6-6.3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <h3>Delivery & spam</h3>
                    <ul>
                      <li>
                        <a href="#">My mail is going to spam</a>
                      </li>
                      <li>
                        <a href="#">Releasing a message from quarantine</a>
                      </li>
                      <li>
                        <a href="#">Reporting a phishing message</a>
                      </li>
                      <li>
                        <a href="#">What we do about abuse</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 6 guides →</a>
                  </div>
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="3.5" width="13" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M1.5 6.4h13" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                    <h3>Billing</h3>
                    <ul>
                      <li>
                        <a href="#">Paying by bank transfer</a>
                      </li>
                      <li>
                        <a href="#">Paying by USSD</a>
                      </li>
                      <li>
                        <a href="#">Downloading a VAT invoice</a>
                      </li>
                      <li>
                        <a href="#">What happens if payment is late</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 6 guides →</a>
                  </div>
                  <div className="cat">
                    <span className="ic" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <path d="M3 13.5 8 2l5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M5 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3>Moving to Ziroemail</h3>
                    <ul>
                      <li>
                        <a href="#">Moving from Google Workspace</a>
                      </li>
                      <li>
                        <a href="#">Moving from cPanel</a>
                      </li>
                      <li>
                        <a href="#">Keeping your old address working</a>
                      </li>
                      <li>
                        <a href="#">What comes across, and what does not</a>
                      </li>
                    </ul>
                    <a className="more" href="#">All 5 guides →</a>
                  </div>
                </Reveal>
              </div>
            </section>
            {/* ===== STILL STUCK ===== */}
            <section className="sec bg-ink center">
              <div className="wrap wrap-tight">
                <h2>Still stuck?</h2>
                <p className="lead mt">
                  Send us a screenshot on WhatsApp. We would rather fix it with you than have you read four more articles.
                </p>
                <div className="btn-row center mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('contact')}>
                    Message us
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('status')}>
                    Check system status
                  </Link>
                </div>
              </div>
            </section>
        </>
    );
}

Help.layout = (page) => (
    <PublicLayout page="help">{page}</PublicLayout>
);

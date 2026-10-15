import PlanPicker from '../../Components/domain/PlanPicker';
import PlanStorageTable from '../../Components/domain/PlanStorageTable';
import PriceToggles from '../../Components/domain/PriceToggles';
import { plansFixture } from '../../fixtures/plans';
import { productSchema } from '../../Lib/schema';
import Seo from '../../Components/seo/Seo';
import { Link, usePage } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Rise from '../../Components/craft/Rise';
import Shape from '../../Components/craft/Shape';
import Cycler from '../../Components/craft/Cycler';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

export default function Index() {
    const { site } = usePage().props;

    return (
        <>
            <Seo title="Ziroemail — Mail that arrives"
                description="Business email on your own domain for Nigerian companies. Mail that reaches the inbox, phones that set themselves up, and payment in naira."
                path="/"
                ogTitle="Ziroemail — Business email that reaches the inbox"
                ogDescription="Professional email on your own domain for Nigerian businesses. Storage you share between mailboxes, phones that set themselves up, and payment in naira or dollars."
                schema={productSchema(site.url)} />

            {/* ============ HERO ============ */}
            <section className="hero">
              <Shape variant="ring" className="s1" />
              <Shape variant="disc" className="s2" />
              <Shape variant="flap" className="s3" />
              <div className="wrap wrap-wide" data-hero="">
                <h1>
                  <Rise index={0}>Mail</Rise>
                  {' '}
                  <Rise index={1}>that</Rise>
                  {' '}
                  <Rise index={2} marked>arrives.</Rise>
                </h1>
                <p className="sub">
                  Business email on your own domain, set up so it reaches the inbox. Built in Port Harcourt, paid for in naira or dollars.
                </p>
                <div className="btn-row">
                  <Link className="btn btn-pri btn-lg" href={route('signup')}>
                    Get started
                    {' '}
                    <svg className="arr" width="16" height="12" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                      <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('pricing')}>
                    See pricing
                  </Link>
                </div>
              </div>
            </section>
            {/* ============ CHOOSE US ============ */}
            <section className="choose sec-sm">
              <div className="wrap wrap-wide">
                <p className="choose-in">
                  <span className="lead-in">You choose us because</span>
                  {' '}
                  <Cycler hold={2400} items={["we are secure.","the interface is a pleasure.","support answers.","we simply work."]} />
                </p>
              </div>
            </section>
            {/* ============ WHAT YOU GET ============ */}
            <section className="offer">
              <div className="offer-i">
                <span className="n">01</span>
                <h3>Your own domain</h3>
                <p>
                  Every mailbox on the name your customers already know, with the records that prove the mail is really yours.
                </p>
              </div>
              <div className="offer-i">
                <span className="n">02</span>
                <h3>Every device</h3>
                <p>
                  Webmail, Outlook, Apple Mail and the Gmail app. Staff phones configure themselves from a single link.
                </p>
              </div>
              <div className="offer-i">
                <span className="n">03</span>
                <h3>Paid in naira</h3>
                <p>Bank transfer, USSD or card. No dollar card, no foreign limit failing at renewal.</p>
              </div>
              <div className="offer-i">
                <span className="n">04</span>
                <h3>Answered by people</h3>
                <p>WhatsApp support from the team that runs the servers, not a queue in another time zone.</p>
              </div>
            </section>
            {/* ============ STATEMENT ============ */}
            <section className="statement">
              <Shape variant="ring" className="st1" />
              <Shape variant="disc" className="st2" />
              <div className="wrap">
                <p className="big">
                  Ziroemail.
                  <br />
                  <em>Zero spam.</em>
                </p>
                <p className="sub">
                  Authentication set up before your first message leaves, and sending watched afterwards. Your invoices land where they belong.
                </p>
              </div>
            </section>
            {/* ============ PROOF ============ */}
            <section className="proof">
              <Reveal as="figure" dir="left" className="proof-photo" style={{ margin: "0" }}>
                <img src="/images/photos/1739303987861-1b0c1104b747.jpg" alt="Two business owners working together on a laptop" width="1000" height="760" loading="lazy" decoding="async" />
              </Reveal>
              <Reveal dir="right" className="proof-copy bg-soft">
                <span className="eyebrow" style={{ marginBottom: "18px" }}>Switching</span>
                <h2>Move across without losing a day</h2>
                <p className="lead mt">
                  Your current email keeps working while we import your history. We only cut over once every record checks out.
                </p>
                <Link className="tlink mt-l" href={route('migrate')}>
                  How switching works
                  {' '}
                  <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                    <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </Reveal>
            </section>
            {/* ============ STORAGE MODEL ============ */}
            <section className="sec">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">How it is sold</span>
                  <h2>One plan per domain. Split the storage however you like.</h2>
                  <p className="lead">
                    You buy a pool for the domain, not an allowance per person. Give one mailbox the lot, or spread it across twenty — and add more whenever you need it.
                  </p>
                </Reveal>
                <div className="model">
                  <div className="domain-card">
                    <p className="dom">
                      <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="6.5" stroke="#1066C6" strokeWidth="1.5" />
                        <path d="M1.5 8h13M8 1.5c1.8 2 2.6 4.2 2.6 6.5S9.8 12.5 8 14.5c-1.8-2-2.6-4.2-2.6-6.5S6.2 3.5 8 1.5z" stroke="#1066C6" strokeWidth="1.3" />
                      </svg>
                      {' '}
                      adaobifoods.com
                      {' '}
                      <span className="pill pill-info">Business · 30 GB</span>
                    </p>
                    <div className="pool mt" role="img" aria-label="30 GB pool split: victory 12 GB, sales 8 GB, ngozi 4 GB, emeka 2 GB, 4 GB unassigned">
                      <span className="pool-seg s1" style={{ flex: "12" }}>12 GB</span>
                      {' '}
                      <span className="pool-seg s2" style={{ flex: "8" }}>8 GB</span>
                      {' '}
                      <span className="pool-seg s3" style={{ flex: "4" }}>4 GB</span>
                      {' '}
                      <span className="pool-seg s4" style={{ flex: "2" }}>2</span>
                      {' '}
                      <span className="pool-seg free" style={{ flex: "4" }}>4 free</span>
                    </div>
                    <div className="tbl-wrap" style={{ marginTop: "20px", borderRadius: "var(--r-xs)" }}>
                      <table className="data" style={{ minWidth: "0" }}>
                        <caption className="sr-only">Storage assigned to each mailbox on adaobifoods.com</caption>
                        <thead>
                          <tr>
                            <th scope="col">Mailbox</th>
                            <th scope="col" className="c">Assigned</th>
                            <th scope="col" className="c">Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th scope="row" className="mono">victory@</th>
                            <td className="c num">12 GB</td>
                            <td className="c num">4.2 GB</td>
                          </tr>
                          <tr>
                            <th scope="row" className="mono">sales@</th>
                            <td className="c num">8 GB</td>
                            <td className="c num">6.1 GB</td>
                          </tr>
                          <tr>
                            <th scope="row" className="mono">ngozi@</th>
                            <td className="c num">4 GB</td>
                            <td className="c num">1.8 GB</td>
                          </tr>
                          <tr>
                            <th scope="row" className="mono">emeka@</th>
                            <td className="c num">2 GB</td>
                            <td className="c num">1.4 GB</td>
                          </tr>
                          <tr>
                            <th scope="row" style={{ color: "var(--tx-3)" }}>Unassigned</th>
                            <td className="c num" style={{ color: "var(--tx-3)" }}>4 GB</td>
                            <td className="c" style={{ color: "var(--tx-3)" }}>—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="sm mut" style={{ marginTop: "14px" }}>Four mailboxes, one plan. Re-slice it any time from the dashboard — no new purchase.</p>
                  </div>
                  <div>
                    <ul className="ticks">
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Unlimited mailboxes.</b>
                          {' '}
                          Ten users on the 10 GB plan is fine, as long as their quotas add up to 10 GB. We do not charge per seat.
                        </span>
                      </li>
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Need more? Just add it.</b>
                          {' '}
                          Storage is sold by the gigabyte at the same price on every plan, and joins the pool immediately.
                        </span>
                      </li>
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Two domains, two plans.</b>
                          {' '}
                          Storage never crosses a domain boundary — that separation is what protects each domain's sending reputation.
                        </span>
                      </li>
                    </ul>
                    <PlanStorageTable />
                    <Link className="tlink mt-l" href={route('pricing')}>
                      See how storage is priced
                      {' '}
                      <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                        <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            {/* ============ PRICING ============ */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head center mb-l">
                  <span className="eyebrow">Pricing</span>
                  <h2>One plan per domain</h2>
                  <p className="lead">No setup fee and no per-seat charge. Monthly or yearly — the price is the same.</p>
                </Reveal>
                <PriceToggles />
                <PlanPicker variant="home" />
                <p className="center sm mut mt-l">
                  Prices exclude VAT at {plansFixture.vatRate * 100}%. One plan covers one domain.
                  {' '}
                  <Link className="tlink" href={route('pricing')} style={{ border: "none" }}>
                    Work out your total →
                  </Link>
                </p>
              </div>
            </section>
            {/* ============ CLOSE ============ */}
            <section className="sec close-band">
              <Shape variant="ring" className="c1" />
              <div className="wrap">
                <h2>Set up in an afternoon</h2>
                <p className="lead">
                  Connect your domain, add your staff, and have every phone working before you close for the day.
                </p>
                <div className="btn-row center mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('signup')}>
                    Get started
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('contact')}>
                    Talk to us
                  </Link>
                </div>
              </div>
            </section>
        </>
    );
}

Index.layout = (page) => (
    <PublicLayout page="index">{page}</PublicLayout>
);

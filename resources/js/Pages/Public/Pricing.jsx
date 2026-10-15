import Faq from '../../Components/domain/Faq';
import PlanPicker from '../../Components/domain/PlanPicker';
import Price from '../../Components/domain/Price';
import PriceToggles from '../../Components/domain/PriceToggles';
import Ticks from '../../Components/ui/Tick';
import { plans, plansFixture } from '../../fixtures/plans';
import { faqSchema, productSchema } from '../../Lib/schema';
import { formatPrice } from '../../Lib/money';
import Seo from '../../Components/seo/Seo';
import { Link, usePage } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Shape from '../../Components/craft/Shape';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const faqs = [
    {
        q: "Can two of my domains share one plan?",
        a: "No. Each domain needs its own plan. Storage is shared freely between mailboxes on the same domain, but never across domains — that separation is what stops one domain's sending problems affecting another's delivery.",
    },
    {
        q: "How many mailboxes can I create?",
        a: "As many as your pool supports. Ten staff on the 10 GB Starter plan works if their quotas add up to 10 GB. Give one person the whole pool if that suits you better — we do not charge per seat.",
    },
    {
        q: "What happens when the pool runs out?",
        a: "We warn you at 80% and again at 95%. Add the storage you need and it is available immediately, or lower a mailbox quota to free space. Mail is not deleted because a pool filled up — new mail queues while you sort it out.",
    },
    {
        q: "Can I change how storage is split later?",
        a: "Yes, whenever you like, from your dashboard. Lowering a quota below what a mailbox already uses is blocked until that mailbox clears some space, so nothing is lost.",
    },
    {
        q: "What if I reach my plan's ceiling?",
        a: "Starter tops out at 25 GB and Business at 100 GB. At that point you move to the next plan, keeping the same domain and mailboxes — only the pool changes. Premium has no ceiling.",
    },
    {
        q: "Do you have a free trial?",
        a: "Not at the moment, and we would rather explain why than pretend it is an oversight. Free mailboxes are how spammers get into a mail service, and one of them can get every other customer's mail blocked. Every account here is paid and tied to a domain you can prove you own.",
    },
];

const { extraStorage } = plansFixture;
const starter = plans[0];

export default function Pricing() {
    const { site } = usePage().props;

    return (
        <>
            <Seo title="Pricing — Ziroemail"
                description="One plan per domain, with storage you share between mailboxes however you like. Add exactly as much extra storage as you need. Paid in naira or dollars."
                path="/pricing"
                ogTitle="Pricing — one plan per domain | Ziroemail"
                ogDescription="Each plan gives your domain a storage pool you split between mailboxes. Add storage whenever you need it. From ₦12,000 a year."
                schema={[productSchema(site.url), faqSchema(faqs)]} />

            {/* ============ HERO ============ */}
            <section className="p-hero">
              <Shape variant="ring" className="ph1" />
              <Shape variant="flap" className="ph2" />
              <div className="wrap" data-hero="">
                <span className="eyebrow" style={{ marginBottom: "20px", display: "block" }}>Pricing</span>
                <h1>One plan per domain.</h1>
                <p className="lead">
                  Each plan gives your domain a pool of storage. Split it between as many mailboxes as you need — two gigabytes here, one there, or the whole pool to a single address.
                </p>
                <p className="sm mut" style={{ marginTop: "14px" }}>
                  Paying for a year or more brings the monthly rate down — {starter.name} is {formatPrice(starter.price.NGN.monthly)} a month, or {formatPrice(starter.price.NGN.yearly / 12)} a month on a yearly term.
                </p>
                <PriceToggles />
              </div>
            </section>
            {/* ============ PLANS ============ */}
            <section style={{ paddingBottom: "var(--gutter)" }}>
              <div className="wrap plans-wrap">
                <PlanPicker variant="pricing" />
                <p className="center sm mut mt-l">Prices exclude VAT at 7.5%. One plan covers one domain.</p>
              </div>
            </section>
            {/* ============ HOW STORAGE WORKS ============ */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">How storage works</span>
                  <h2>A pool for the domain, not an allowance per person</h2>
                  <p className="lead">
                    Buy once, then give each mailbox exactly what it needs. Change the split whenever you like — no new purchase, no waiting.
                  </p>
                </Reveal>
                <div className="alloc">
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
                    <div className="pool-key">
                      <span>
                        <i style={{ background: "var(--blue)" }} />
                        {' '}
                        victory@
                      </span>
                      {' '}
                      <span>
                        <i style={{ background: "var(--blue-600)" }} />
                        {' '}
                        sales@
                      </span>
                      {' '}
                      <span>
                        <i style={{ background: "var(--blue-700)" }} />
                        {' '}
                        ngozi@
                      </span>
                      {' '}
                      <span>
                        <i style={{ background: "var(--blue-800)" }} />
                        {' '}
                        emeka@
                      </span>
                      {' '}
                      <span>
                        <i style={{ background: "#E2E8F0" }} />
                        {' '}
                        unassigned
                      </span>
                    </div>
                    <p className="sm mut" style={{ marginTop: "18px" }}>
                      Four mailboxes on one 30 GB plan. The owner can re-slice this at any time, or give all 30 GB to a single address.
                    </p>
                  </div>
                  <div>
                    <ul className="ticks">
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Create as many mailboxes as you want.</b>
                          {' '}
                          The pool is the limit, not a seat count.
                        </span>
                      </li>
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Set each quota yourself.</b>
                          {' '}
                          Twelve gigabytes for accounts, five hundred megabytes for a seasonal hire. Adjust any time.
                        </span>
                      </li>
                      <li>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span>
                          <b>Run out? Add more.</b>
                          {' '}
                          Storage is sold by the gigabyte and lands in the same pool immediately.
                        </span>
                      </li>
                    </ul>
                    <div className="note note-warn mt-l">
                      <h4>One plan covers one domain</h4>
                      <p>
                        Storage is shared freely between mailboxes on the same domain, but never across domains. A second domain needs its own plan — that boundary is what keeps one domain's sending reputation from affecting another's.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* ============ EXTRA STORAGE ============ */}
            <section className="sec">
              <div className="wrap">
                <div className="addon">
                  <div>
                    <span className="eyebrow" style={{ marginBottom: "16px", display: "block" }}>Extra storage</span>
                    <h2 style={{ fontSize: "clamp(1.5rem,1.25rem + 1.2vw,2.1rem)" }}>Add {extraStorage.blockGb} GB whenever you need it</h2>
                    <p className="lead mt" style={{ color: "var(--tx-2)" }}>
                      The same price on every plan. Blocks join your domain's pool straight away and renew alongside it.
                    </p>
                  </div>
                  <div>
                    <div className="price">
                      <Price price={extraStorage.price} unit={(term) => `per ${extraStorage.blockGb} GB / ${term === 'annual' ? 'year' : 'month'}`} />
                    </div>
                    <Ticks className="mt" items={plans.map((plan) => (plan.ceilingGb === null ? `${plan.name} has no ceiling` : `${plan.name} expandable to ${plan.ceilingGb} GB`))} />
                  </div>
                </div>
              </div>
            </section>
            {/* ============ COMPARISON ============ */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">Compare</span>
                  <h2>What is in each plan</h2>
                </Reveal>
                <div className="tbl-wrap">
                  <table className="data">
                    <caption className="sr-only">Feature comparison across Starter, Business and Premium</caption>
                    <thead>
                      <tr>
                        <th scope="col">Feature</th>
                        <th scope="col" className="c">Starter</th>
                        <th scope="col" className="c">Business</th>
                        <th scope="col" className="c">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Storage included</th>
                        {plans.map((plan) => <td key={plan.code} className="c num">{plan.poolGb} GB</td>)}
                      </tr>
                      <tr>
                        <th scope="row">Expandable to</th>
                        {plans.map((plan) => (plan.ceilingGb === null ? <td key={plan.code} className="c">No limit</td> : <td key={plan.code} className="c num">{plan.ceilingGb} GB</td>))}
                      </tr>
                      <tr>
                        <th scope="row">Domains per plan</th>
                        <td className="c num">1</td>
                        <td className="c num">1</td>
                        <td className="c num">1</td>
                      </tr>
                      <tr>
                        <th scope="row">Mailboxes</th>
                        <td className="c">Unlimited</td>
                        <td className="c">Unlimited</td>
                        <td className="c">Unlimited</td>
                      </tr>
                      <tr>
                        <th scope="row">Storage shared across mailboxes</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Per-mailbox quota control</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">SPF, DKIM and DMARC set up for you</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Automatic phone setup</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Spam, virus and phishing filtering</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Import mail from your old provider</th>
                        <td className="n">—</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Shared addresses and forwarding</th>
                        <td className="n">—</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Roles, delegation and audit log</th>
                        <td className="n">—</td>
                        <td className="n">—</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Export all your mail</th>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            {/* ============ FAQ ============ */}
            <section className="sec">
              <div className="wrap wrap-tight">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">Questions</span>
                  <h2>Before you decide</h2>
                </Reveal>
                <Faq items={faqs} />
              </div>
            </section>
            <section className="sec bg-ink center">
              <div className="wrap wrap-tight">
                <h2>Not sure which plan fits?</h2>
                <p className="lead mt">
                  Tell us how many staff you have and roughly how much mail you keep. We will tell you which plan fits — including if that is the cheapest one.
                </p>
                <div className="btn-row center mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('contact')}>
                    Ask us on WhatsApp
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('signup')}>
                    Get started
                  </Link>
                </div>
              </div>
            </section>
        </>
    );
}

Pricing.layout = (page) => (
    <PublicLayout page="pricing">{page}</PublicLayout>
);

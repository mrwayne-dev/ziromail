import { pricingFaqs } from '../../fixtures/faqs';
import PageHero from '../../Components/ui/PageHero';
import CtaBlock from '../../Components/ui/CtaBlock';
import DomainPoolCard from '../../Components/domain/DomainPoolCard';
import Reveal from '../../Components/craft/Reveal';
import Faq from '../../Components/domain/Faq';
import PlanPicker from '../../Components/domain/PlanPicker';
import Price from '../../Components/domain/Price';
import PriceToggles from '../../Components/domain/PriceToggles';
import Ticks, { TickIcon } from '../../Components/ui/Tick';
import { plans, plansFixture } from '../../fixtures/plans';
import { faqSchema, productSchema } from '../../Lib/schema';
import { formatPrice } from '../../Lib/money';
import Seo from '../../Components/seo/Seo';
import { usePage } from '@inertiajs/react';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const faqs = pricingFaqs;

const { extraStorage } = plansFixture;
const starter = plans[0];

export default function Pricing() {
    const { site } = usePage().props;

    return (
        <>
            <Seo title="Pricing | Ziroemail"
                description="One plan per domain, with storage you share between mailboxes however you like. Add exactly as much extra storage as you need. Paid in naira or dollars."
                path="/pricing"
                ogTitle="Pricing: one plan per domain | Ziroemail"
                ogDescription="Each plan gives your domain a storage pool you split between mailboxes. Add storage whenever you need it. From ₦12,000 a year."
                schema={[productSchema(site.url), faqSchema(faqs)]} />

            <PageHero
              eyebrow="Pricing"
              title="One plan per domain."
              lead="Each plan gives your domain a pool of storage. Split it between as many mailboxes as you need: two gigabytes here, one there, or the whole pool to a single address."
            >
              <p className="sm pricing-note">
                Paying for a year or more brings the monthly rate down. {starter.name} is {formatPrice(starter.price.NGN.monthly)} a month, or {formatPrice(starter.price.NGN.yearly / 12)} a month on a yearly term.
              </p>
              <PriceToggles />
            </PageHero>

            <section className="pricing-plans">
              <div className="wrap wrap-wide">
                <PlanPicker variant="pricing" />
                <p className="center sm pricing-vat">Prices exclude VAT at {plansFixture.vatRate * 100}%. One plan covers one domain.</p>
              </div>
            </section>

            {/* ============ HOW STORAGE WORKS ============ */}
            <section className="sec band-soft">
              <div className="wrap">
                <div className="how-split">
                  <Reveal dir="left" className="how-copy">
                    <span className="eyebrow">How storage works</span>
                    <h2>A pool for the domain, not an allowance per person</h2>
                    <p className="lead">
                      Buy once, then give each mailbox exactly what it needs. Change the split whenever you like, with no new purchase and no waiting.
                    </p>
                    <ul className="ticks">
                      <li>
                        <TickIcon size={18} />
                        <span><b>Create as many mailboxes as you want.</b> The pool is the limit, not a seat count.</span>
                      </li>
                      <li>
                        <TickIcon size={18} />
                        <span><b>Set each quota yourself.</b> Twelve gigabytes for accounts, five hundred megabytes for a seasonal hire. Adjust any time.</span>
                      </li>
                      <li>
                        <TickIcon size={18} />
                        <span><b>Run out? Add more.</b> Storage is sold by the gigabyte and lands in the same pool immediately.</span>
                      </li>
                    </ul>
                    <div className="note note-warn">
                      <h4>One plan covers one domain</h4>
                      <p>
                        Storage is shared freely between mailboxes on the same domain, but never across domains. A second domain needs its own plan. That boundary is what keeps one domain's sending reputation from affecting another's.
                      </p>
                    </div>
                  </Reveal>
                  <Reveal dir="right" className="how-card">
                    <DomainPoolCard />
                    <p className="sm how-cap">Four mailboxes on one 30 GB plan. The owner can re-slice this at any time, or give all 30 GB to a single address.</p>
                  </Reveal>
                </div>
              </div>
            </section>

            {/* ============ EXTRA STORAGE ============ */}
            <section className="sec">
              <div className="wrap">
                <Reveal className="addon-card">
                  <div>
                    <span className="eyebrow">Extra storage</span>
                    <h2>Add {extraStorage.blockGb} GB whenever you need it</h2>
                    <p className="lead">The same price on every plan. Blocks join your domain's pool straight away and renew alongside it.</p>
                  </div>
                  <div className="addon-side">
                    <div className="addon-price">
                      <Price price={extraStorage.price} unit={(term) => `per ${extraStorage.blockGb} GB / ${term === 'annual' ? 'year' : 'month'}`} />
                    </div>
                    <Ticks items={plans.map((plan) => (plan.ceilingGb === null ? `${plan.name} has no ceiling` : `${plan.name} expandable to ${plan.ceilingGb} GB`))} />
                  </div>
                </Reveal>
              </div>
            </section>

            {/* ============ COMPARISON ============ */}
            <section className="sec band-soft">
              <div className="wrap">
                <Reveal className="block-head">
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
                        <td className="n">No</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Shared addresses and forwarding</th>
                        <td className="n">No</td>
                        <td className="y">✓</td>
                        <td className="y">✓</td>
                      </tr>
                      <tr>
                        <th scope="row">Roles, delegation and audit log</th>
                        <td className="n">No</td>
                        <td className="n">No</td>
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
              <div className="wrap">
                <Reveal className="block-head center">
                  <span className="eyebrow">Questions</span>
                  <h2>Before you decide</h2>
                </Reveal>
                <div className="faq-list">
                  <Faq variant="cards" items={faqs} />
                </div>
              </div>
            </section>

            <CtaBlock
              title="Not sure which plan fits?"
              lead="Tell us how many staff you have and roughly how much mail you keep. We will tell you which plan fits, including if that is the cheapest one."
              primary={{ label: 'Ask us on WhatsApp', href: route('contact') }}
              secondary={{ label: 'Get started', href: route('signup') }}
            />
        </>
    );
}

Pricing.layout = (page) => (
    <PublicLayout variant="float" page="pricing">{page}</PublicLayout>
);

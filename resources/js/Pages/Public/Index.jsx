import Faq from '../../Components/domain/Faq';
import CtaBlock from '../../Components/ui/CtaBlock';
import Pill from '../../Components/ui/Pill';
import { migrateFaqs, pricingFaqs } from '../../fixtures/faqs';
import SetupSteps from '../../Components/domain/SetupSteps';
import PlanPicker from '../../Components/domain/PlanPicker';
import DomainPoolCard from '../../Components/domain/DomainPoolCard';
import Callout from '../../Components/ui/Callout';
import PlanStorageTable from '../../Components/domain/PlanStorageTable';
import PriceToggles from '../../Components/domain/PriceToggles';
import { plansFixture } from '../../fixtures/plans';
import { faqSchema, productSchema } from '../../Lib/schema';
import Seo from '../../Components/seo/Seo';
import { Link, usePage } from '@inertiajs/react';
import Button, { ArrowIcon, ArrowUpRightIcon } from '../../Components/ui/Button';
import Reveal from '../../Components/craft/Reveal';
import Rise from '../../Components/craft/Rise';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const icon = (path) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Six of the questions people ask first, taken from the pricing and switching copy.
const homeFaqs = [
    { ...pricingFaqs[1], icon: icon('M2.5 13.5v-1a3.5 3.5 0 0 1 3.5-3.5h4a3.5 3.5 0 0 1 3.5 3.5v1M8 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z') },
    { ...pricingFaqs[0], icon: icon('M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM1.5 8h13M8 1.5c1.8 2 2.6 4.2 2.6 6.5S9.8 12.5 8 14.5C6.2 12.5 5.4 10.3 5.4 8S6.2 3.5 8 1.5z') },
    { ...pricingFaqs[5], icon: icon('M8 1.5 2.5 3.5v4c0 3.2 2.3 5.6 5.5 7 3.2-1.4 5.5-3.8 5.5-7v-4L8 1.5z') },
    { ...migrateFaqs[0], icon: icon('M1.5 3.5h13v9h-13zM1.5 4l6.5 5 6.5-5') },
    { ...migrateFaqs[1], icon: icon('M5 1.5h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM7 12.5h2') },
    { ...migrateFaqs[2], icon: icon('M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.5V8l2.5 1.5') },
];

export default function Index() {
    const { site } = usePage().props;

    return (
        <>
            <Seo title="Ziroemail | Mail that arrives"
                description="Business email on your own domain for Nigerian companies. Mail that reaches the inbox, phones that set themselves up, and payment in naira."
                path="/"
                ogTitle="Ziroemail | Business email that reaches the inbox"
                ogDescription="Professional email on your own domain for Nigerian businesses. Storage you share between mailboxes, phones that set themselves up, and payment in naira or dollars."
                schema={[productSchema(site.url), faqSchema(homeFaqs)]} />

            {/* ============ HERO ============ */}
            <section className="hero">
              <div className="wrap wrap-edge hero-in">
                <div data-hero="">
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
                    <Button size="lg" split icon={<ArrowUpRightIcon size={16} />} href={route('signup')}>Get started</Button>
                    <Button variant="line" size="lg" href={route('pricing')}>See pricing</Button>
                  </div>
                </div>
              </div>
            </section>
            {/* ============ WHY US ============ */}
            <section className="why sec">
              <div className="wrap">
                <Reveal className="why-head">
                  <img className="why-mark" src="/images/ziroemail-icon.png" alt="" width="40" height="40" />
                  <h2>You choose us because we simply work.</h2>
                  <p className="why-sub">
                    We are secure. The interface is a pleasure. Support answers. Everything a business needs from email, set up for you and answered by people.
                  </p>
                </Reveal>
                <Reveal dir="scale" className="why-shot">
                  <img
                    src="/images/dashboard-preview.jpg"
                    alt="The Ziroemail dashboard for a business domain: four mailboxes, 13.5 GB used of a 30 GB pool, and every DNS record passing."
                    width="2560" height="1600" loading="lazy" decoding="async"
                  />
                </Reveal>
              </div>
            </section>
            {/* ============ HOW WE SET UP ============ */}
            <section className="setup bg-ink sec">
              <div className="wrap">
                <Reveal className="setup-head">
                  <span className="eyebrow">Switching</span>
                  <h2>Move across without losing a day</h2>
                  <p className="lead">
                    Your current email keeps working while we import your history. We only cut over once every record checks out.
                  </p>
                </Reveal>
                <div className="setup-steps">
                  <SetupSteps />
                </div>
                <p className="setup-more">
                  <Link className="tlink" href={route('migrate')}>
                    How switching works
                    {' '}
                    <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                      <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </p>
              </div>
            </section>
            {/* ============ STORAGE MODEL ============ */}
            <section className="sold sec">
              <div className="wrap wrap-wide">
                <Reveal className="sec-head center">
                  <span className="eyebrow">How it is sold</span>
                  <h2>One plan per domain. Split the storage however you like.</h2>
                  <p className="lead">
                    You buy a pool for the domain, not an allowance per person. Give one mailbox the lot, or spread it across twenty, and add more whenever you need it.
                  </p>
                </Reveal>

                <div className="diagram">
                  <Reveal dir="left" className="diagram-side">
                    <Callout n={1} side="left" title="Unlimited mailboxes.">
                      Ten users on the 10 GB plan is fine, as long as their quotas add up to 10 GB. We do not charge per seat.
                    </Callout>
                    <Callout n={2} side="left" title="Need more? Just add it.">
                      Storage is sold by the gigabyte at the same price on every plan, and joins the pool immediately.
                    </Callout>
                  </Reveal>

                  <Reveal dir="scale" className="diagram-core">
                    <DomainPoolCard />
                  </Reveal>

                  <Reveal dir="right" className="diagram-side">
                    <Callout n={3} side="right" title="Two domains, two plans.">
                      Storage never crosses a domain boundary. That separation is what protects each domain's sending reputation.
                    </Callout>
                  </Reveal>
                </div>

                <div className="sold-ceilings">
                  <PlanStorageTable />
                </div>
                <p className="center sold-more">
                  <Link className="tlink" href={route('pricing')}>
                    See how storage is priced
                    {' '}
                    <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                      <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </p>
              </div>
            </section>
            {/* ============ PRICING ============ */}
            <section className="pricing-sec sec bg-soft">
              <div className="wrap wrap-wide">
                <div className="pricing-head">
                  <Reveal className="pricing-copy">
                    <span className="eyebrow">Pricing</span>
                    <h2>One plan per domain</h2>
                    <p className="lead">No setup fee and no per-seat charge. Monthly or yearly, the price is the same.</p>
                  </Reveal>
                  <PriceToggles />
                </div>
                <PlanPicker variant="home" />
                <p className="pricing-foot sm">
                  Prices exclude VAT at {plansFixture.vatRate * 100}%. One plan covers one domain.
                  {' '}
                  <Link className="tlink" href={route('pricing')} style={{ border: "none" }}>
                    Work out your total →
                  </Link>
                </p>
              </div>
            </section>
            {/* ============ FAQ ============ */}
            <section className="faq-sec sec">
              <div className="wrap">
                <Reveal className="faq-head">
                  <Pill>FAQ</Pill>
                  <h2>Frequently asked questions</h2>
                  <p className="lead">Quick answers on plans, storage and moving over.</p>
                </Reveal>
                <div className="faq-list">
                  <Faq variant="cards" items={homeFaqs} />
                </div>
              </div>
            </section>
            {/* ============ CTA ============ */}
            <CtaBlock
              title="Set up in an afternoon"
              lead="Connect your domain, add your staff, and have every phone working before you close for the day."
              primary={{ label: 'Get started', href: route('signup') }}
              secondary={{ label: 'Talk to us', href: route('contact') }}
            />
        </>
    );
}

Index.layout = (page) => (
    <PublicLayout variant="float" page="index">{page}</PublicLayout>
);

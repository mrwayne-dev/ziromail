import { Link } from '@inertiajs/react';
import Reveal from '../craft/Reveal';
import OptionCard, { OptionGroup } from '../ui/OptionCard';
import { plans as fixturePlans } from '../../fixtures/plans';
import { route } from '../../Lib/route';
import Price from './Price';

const perDomain = (term) => (term === 'annual' ? '/ domain / year' : '/ domain / month');

function Ceiling({ plan, variant }) {
    if (variant === 'home') {
        return (
            <p className="yr">
                {plan.ceilingGb === null ? (
                    <>Storage expands <b>without a limit</b></>
                ) : (
                    <>Storage expandable to <b>{plan.ceilingGb} GB</b></>
                )}
            </p>
        );
    }

    return (
        <p className="cap">
            {plan.ceilingGb === null ? (
                'Add storage without a limit. Buy as much as you need, whenever you need it.'
            ) : (
                <>Add storage up to <b>{plan.ceilingGb} GB</b>. {plan.copy.pricing.ceilingNote}</>
            )}
        </p>
    );
}

function ChevronRight() {
    return (
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
            <path d="M1.5 1.5 6 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Joined square panels: index and badge, name, price, hairline, a plus list, and a
// full-width action bar. The featured plan is filled with the brand blue.
function PlanPanel({ plan, index, variant }) {
    const copy = plan.copy[variant];
    return (
        <article className={`card-panel plan-panel${plan.featured ? ' is-featured' : ''}`}>
            <div className="panel-top">
                <span>{String(index + 1).padStart(2, '0')}</span>
                {plan.featured && <span>Most chosen</span>}
            </div>
            <h2 className="plan-name-h">{plan.name}</h2>
            <p className="panel-tag">{copy.tagline}</p>
            <div className="panel-price">
                <Price price={plan.price} unit={perDomain} />
            </div>
            <Ceiling plan={plan} variant={variant} />
            <ul className="panel-list">
                <li><b>{plan.poolGb}&nbsp;GB</b> shared across the domain</li>
                {copy.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                ))}
            </ul>
            <Link className="panel-cta" href={route('signup', { plan: plan.code })}>
                <span>Choose {plan.name}</span>
                <ChevronRight />
            </Link>
        </article>
    );
}

// One plan as a radio card for the onboarding step: name, price, and a one-line summary.
function PlanOption({ plan, checked, onChange, current }) {
    const ceiling = plan.ceilingGb === null ? 'Storage expands without a limit.' : `Expandable to ${plan.ceilingGb} GB.`;

    return (
        <OptionCard
            name="plan"
            value={plan.code}
            checked={checked}
            onChange={onChange}
            title={plan.name}
            badge={current ? 'Your plan today' : plan.featured ? 'Most chosen' : undefined}
            aside={<Price price={plan.price} unit={(term) => (term === 'annual' ? ' / year' : ' / month')} wrapper="span" />}
            description={`${plan.poolGb} GB shared across unlimited mailboxes. ${ceiling}`}
        />
    );
}

/*
 * The three plans. `variant` picks the presentation:
 *   'home'     compact joined panels, pool as the first tick
 *   'pricing'  the same panels with the pool shown as its own line
 *   'select'   radio cards for choosing one (onboarding, add a domain, change plan); takes
 *              `value` and `onChange`, and `currentCode` to mark the plan already held
 * Prices and pool sizes come from fixtures/plans.js only.
 */
export default function PlanPicker({ variant = 'home', value, onChange, currentCode, plans = fixturePlans }) {
    if (variant === 'select') {
        return (
            <OptionGroup legend="Choose a plan" hideLegend>
                {plans.map((plan) => (
                    <PlanOption key={plan.code} plan={plan} checked={value === plan.code} onChange={onChange} current={currentCode === plan.code} />
                ))}
            </OptionGroup>
        );
    }

    return (
        <Reveal className="plan-panels" stagger>
            {plans.map((plan, i) => (
                <PlanPanel key={plan.code} plan={plan} index={i} variant={variant} />
            ))}
        </Reveal>
    );
}

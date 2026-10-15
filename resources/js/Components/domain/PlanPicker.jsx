import { Link } from '@inertiajs/react';
import Reveal from '../craft/Reveal';
import { TickIcon } from '../ui/Tick';
import { plans } from '../../fixtures/plans';
import { route } from '../../Lib/route';
import Price from './Price';

const perDomain = (term) => (term === 'annual' ? '/ domain / year' : '/ domain / month');

function Ceiling({ plan, variant }) {
    if (variant === 'home') {
        return (
            <p className="yr">
                {plan.ceilingGb === null ? (
                    <>Storage expands <b style={{ color: 'var(--tx-1)' }}>without a limit</b></>
                ) : (
                    <>Storage expandable to <b style={{ color: 'var(--tx-1)' }}>{plan.ceilingGb} GB</b></>
                )}
            </p>
        );
    }

    return (
        <p className="cap">
            {plan.ceilingGb === null ? (
                'Add storage without a limit — buy as much as you need, whenever you need it.'
            ) : (
                <>Add storage up to <b>{plan.ceilingGb} GB</b>. {plan.copy.pricing.ceilingNote}</>
            )}
        </p>
    );
}

/*
 * The three plan cards. `variant` picks the copy set: 'home' (compact, with the
 * pool as the first tick) or 'pricing' (pool shown as its own line). Prices and
 * pool sizes come from fixtures/plans.js only.
 */
export default function PlanPicker({ variant = 'home' }) {
    return (
        <Reveal className="plans" stagger>
            {plans.map((plan) => {
                const copy = plan.copy[variant];
                return (
                    <article key={plan.code} className={`plan${plan.featured ? ' plan-hot' : ''}${variant === 'home' ? ' tilt' : ''}`}>
                        {plan.featured && <span className="plan-flag">Most chosen</span>}
                        <h3>{plan.name}</h3>
                        <p className="sm mut mt-s">{copy.tagline}</p>
                        {variant === 'pricing' && (
                            <div className="store">
                                <b>{plan.poolGb} GB</b>
                                <span>shared storage</span>
                            </div>
                        )}
                        <div className="amt">
                            <Price price={plan.price} unit={perDomain} />
                        </div>
                        <Ceiling plan={plan} variant={variant} />
                        <ul className="ticks">
                            {variant === 'home' && (
                                <li>
                                    <TickIcon />
                                    <span><b>{plan.poolGb}&nbsp;GB</b> shared across the domain</span>
                                </li>
                            )}
                            {copy.features.map((feature) => (
                                <li key={feature}>
                                    <TickIcon />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            className={`btn ${plan.featured ? 'btn-pri' : 'btn-line'}`}
                            href={route('signup', { plan: plan.code })}
                        >
                            Choose {plan.name}
                        </Link>
                    </article>
                );
            })}
        </Reveal>
    );
}

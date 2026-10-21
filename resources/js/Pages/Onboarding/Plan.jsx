import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import OrderSummary from '../../Components/domain/OrderSummary';
import PlanPicker from '../../Components/domain/PlanPicker';
import TermSwitch from '../../Components/domain/TermSwitch';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import usePricingState from '../../Hooks/usePricingState';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { buildOrder } from '../../Lib/order';
import { route } from '../../Lib/route';

export default function Plan() {
    const { domain, domainId, planCode: initialPlan } = useOnboarding();
    const { term, currency } = usePricingState();
    const [planCode, setPlanCode] = useState(initialPlan);
    const [saving, setSaving] = useState(false);
    const order = buildOrder({ planCode, term, currency });

    function onSubmit(e) {
        e.preventDefault();
        router.put(route('onboarding.plan.update', { domain: domainId }), { plan: planCode }, {
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
        });
    }

    return (
        <>
            <Seo title="Choose your plan | Ziroemail" description="One plan covers your domain and every mailbox on it." path="/onboarding/plan" noindex />

            <div className="ob-grid ob-grid-plan">
                <div>
                    <div data-hero>
                        <h1>Choose your plan</h1>
                        <p className="lead">One plan covers this domain and every mailbox on it. Storage is a single pool you divide however you like. You are never charged per person.</p>
                    </div>

                    <div className="for-dom">
                        <span>
                            <span className="k">Setting up</span>
                            <span className="v">{domain}</span>
                        </span>
                        <Link className="btn btn-line btn-sm" href={route('onboarding.domain')}>Change domain</Link>
                    </div>

                    <form onSubmit={onSubmit} noValidate>
                        <div className="plans-head">
                            <h2>Plans</h2>
                            <TermSwitch />
                        </div>
                        <p className="sm">Yearly is one payment to remember instead of twelve.</p>

                        <PlanPicker variant="select" value={planCode} onChange={setPlanCode} />

                        <Note title="Payment opens soon" className="pay-note">
                            <p>Your domain and plan are saved. You can set up your DNS records and mailboxes now; mail starts flowing once payment is switched on for your account.</p>
                        </Note>

                        <Button type="submit" size="lg" full busy={saving}>Save plan and continue</Button>
                    </form>
                </div>

                <OrderSummary
                    order={order}
                    rows={[
                        { label: 'Domain', value: domain, mono: true },
                        { label: 'Plan', value: order.plan.name },
                        { label: 'Storage pool', value: `${order.plan.poolGb} GB` },
                        { label: 'Mailboxes', value: 'Unlimited' },
                        { label: 'Billed', value: order.termLabel },
                    ]}
                >
                    <p className="hint">Renews automatically. Cancel any time from your dashboard.</p>
                </OrderSummary>
            </div>
        </>
    );
}

Plan.layout = (page) => <OnboardingLayout step="plan">{page}</OnboardingLayout>;

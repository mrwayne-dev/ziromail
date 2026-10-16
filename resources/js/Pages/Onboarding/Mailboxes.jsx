import { router } from '@inertiajs/react';
import { useState } from 'react';
import PoolAllocator, { checkAllocation } from '../../Components/domain/PoolAllocator';
import Button from '../../Components/ui/Button';
import AsideCards from '../../Components/ui/AsideCards';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { plans, plansFixture } from '../../fixtures/plans';
import { encodeMailboxes, rowsFromFixture } from '../../Lib/onboarding';
import { route } from '../../Lib/route';

const asides = [
    {
        title: 'There is no seat limit',
        body: 'Create as many mailboxes as you like. The pool is the only limit. Ten people sharing 30 GB is fine if their quotas add up.',
    },
    {
        title: 'Start small',
        body: 'Give each person a little less than you think. Raising a quota takes two seconds later; you cannot lower one below what a mailbox already holds.',
    },
    {
        title: 'Leave some unassigned',
        body: 'Storage you do not hand out stays in the pool, ready for a new hire or a mailbox that fills faster than expected.',
    },
    {
        title: 'Shared addresses cost nothing',
        body: 'An address like info@ that just forwards into an existing mailbox is not a mailbox and uses no storage of its own. Add those from the dashboard afterwards.',
    },
];

export default function Mailboxes() {
    const { domain, planCode, carry } = useOnboarding();
    const plan = plans.find((p) => p.code === planCode) ?? plans[0];
    const [rows, setRows] = useState(() => rowsFromFixture(onboardingFixture.mailboxes.initial));
    const [showErrors, setShowErrors] = useState(false);
    const { over, errors } = checkAllocation(rows, plan.poolGb);

    function onSubmit(e) {
        e.preventDefault();
        if (over || Object.keys(errors).length > 0) {
            setShowErrors(true);
            return;
        }
        router.visit(route('onboarding.done', carry({ mailboxes: encodeMailboxes(rows) })));
    }

    return (
        <>
            <Seo title="Create your mailboxes | Ziroemail" description="Divide your storage pool between your first mailboxes." path="/onboarding/mailboxes" noindex />

            <div className="ob-grid ob-grid-wide">
                <form onSubmit={onSubmit} noValidate>
                    <div data-hero>
                        <h1>Create your first mailboxes</h1>
                        <p className="lead">
                            Your {plan.name} plan gives <span className="mono">{domain}</span> a pool of <b className="strong">{plan.poolGb}&nbsp;GB</b>. Divide it however suits you. You can change any of this later.
                        </p>
                    </div>

                    <PoolAllocator
                        rows={rows}
                        onChange={setRows}
                        poolGb={plan.poolGb}
                        domain={domain}
                        planLabel={`${plan.name} · expandable to ${plan.ceilingGb} GB`}
                        extraBlockGb={plansFixture.extraStorage.blockGb}
                        step={onboardingFixture.mailboxes.step}
                        showErrors={showErrors}
                    />

                    <div className="btn-row ob-actions">
                        <Button type="submit" size="lg" disabled={over}>Create these mailboxes</Button>
                        <Button variant="line" size="lg" href={route('onboarding.records', carry())}>Back to records</Button>
                    </div>
                </form>

                <AsideCards items={asides} />
            </div>
        </>
    );
}

Mailboxes.layout = (page) => <OnboardingLayout step="mailboxes">{page}</OnboardingLayout>;

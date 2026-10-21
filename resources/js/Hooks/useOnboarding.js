import { usePage } from '@inertiajs/react';

/*
 * What the wizard carries from step to step: the domain being set up and the plan on it.
 * The server holds both, so a refresh or a second device picks up where setup left off.
 * `carry(extra)` is the params for the next step's route(): just the domain's public id.
 */
export default function useOnboarding() {
    const { onboarding } = usePage().props;

    return {
        domain: onboarding.domain.name,
        domainId: onboarding.domain.id,
        plan: onboarding.plan,
        planCode: onboarding.plan.code,
        carry: (extra = {}) => ({ domain: onboarding.domain.id, ...extra }),
    };
}

import { onboardingFixture } from '../fixtures/onboarding';
import useQuery from './useQuery';

/*
 * What the wizard carries from step to step: the domain and the chosen plan.
 * Until there is a server to remember them they travel in the URL, falling back
 * to the fixture's. `carry(extra)` is the params for the next step's route().
 */
export default function useOnboarding() {
    const query = useQuery();
    const domain = query.get('domain') ?? onboardingFixture.domain;
    const planCode = query.get('plan') ?? onboardingFixture.plan;

    return { domain, planCode, carry: (extra = {}) => ({ domain, plan: planCode, ...extra }) };
}

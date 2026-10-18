import { router } from '@inertiajs/react';
import TwoFactorSetupFlow from '../../Components/domain/TwoFactorSetupFlow';
import Seo from '../../Components/seo/Seo';
import useConfirmPassword from '../../Hooks/useConfirmPassword';
import AuthLayout from '../../Layouts/AuthLayout';

/*
 * The full-page enrolment: used when two-factor is required (staff always, owners
 * when enforcement is switched on). `forced` pages offer no way around it. `endpoints`
 * and `next` come from the server so the staff and user variants share this page.
 */
export default function TwoFactorSetup({ forced, endpoints, next }) {
    const { confirm, dialog } = useConfirmPassword(endpoints.confirmPassword);

    return (
        <>
            <Seo title="Set up two-factor | Ziroemail" description="Add an authenticator app to your sign in." path="/two-factor/setup" noindex />

            <div data-hero>
                <h1>{forced ? 'Two-factor is required' : 'Turn on two-factor'}</h1>
            </div>

            <TwoFactorSetupFlow
                endpoints={endpoints}
                ensureConfirmed={confirm}
                doneLabel="Continue"
                onDone={() => router.visit(next)}
            />
            {dialog}
        </>
    );
}

TwoFactorSetup.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;

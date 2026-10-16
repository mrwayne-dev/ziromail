import { Link } from '@inertiajs/react';
import { HelpIcon } from '../Components/ui/Icons';
import Logo from '../Components/ui/Logo';
import ProgressSteps from '../Components/ui/ProgressSteps';
import useHeroAnimation from '../Hooks/useHeroAnimation';
import { onboardingFixture } from '../fixtures/onboarding';
import { route } from '../Lib/route';

/*
 * Shell for the setup wizard: logo, a way to ask for help, and the progress
 * trail. `step` is the key of the current step; pass null for the finished
 * screen, which has no trail and swaps the help link for `headerEnd`.
 */
export default function OnboardingLayout({ step, headerEnd, children }) {
    useHeroAnimation();

    return (
        <div className="pg-ob">
            <a className="skip-link" href="#main">Skip to content</a>
            <header className="ob-hdr">
                <div className="wrap ob-bar">
                    <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                        <Logo variant="black" />
                    </Link>
                    {headerEnd ?? (
                        <Link className="ob-help" href={route('contact')}>
                            <HelpIcon /> Get help on WhatsApp
                        </Link>
                    )}
                </div>
            </header>
            <main id="main" className={step ? 'ob' : 'ob ob-done'}>
                <div className="wrap">
                    {step && <ProgressSteps steps={onboardingFixture.steps} current={step} label="Setup progress" />}
                    {children}
                </div>
            </main>
        </div>
    );
}

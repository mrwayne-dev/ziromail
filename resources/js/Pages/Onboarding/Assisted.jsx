import { useState } from 'react';
import RegistrarPicker from '../../Components/domain/RegistrarPicker';
import Button from '../../Components/ui/Button';
import AsideCards from '../../Components/ui/AsideCards';
import { BoltIcon, CopyIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { Link } from '@inertiajs/react';
import { route } from '../../Lib/route';

const asides = [
    {
        title: 'No waiting on anybody',
        body: 'Setting up a domain does not need us. Paste four records, or approve one link, and it is done, at whatever hour you happen to be working.',
    },
    {
        title: 'Only the mail records',
        body: 'One-click setup adds MX, SPF, DKIM and DMARC, and nothing else. Anything to do with your website is left exactly as it is.',
    },
    {
        title: 'Nothing breaks meanwhile',
        body: 'Your current email keeps working the whole time. The switch only happens once every record verifies.',
    },
];

export default function Assisted() {
    const { carry } = useOnboarding();
    const [key, setKey] = useState('');
    const registrar = onboardingFixture.registrars.find((r) => r.key === key);
    const name = !registrar || registrar.key === 'other' ? 'your registrar' : registrar.name;

    return (
        <>
            <Seo title="Connect it automatically | Ziroemail" description="Tell us where your domain is registered and we hand you exactly what to do." path="/onboarding/assisted" noindex />

            <div className="ob-grid">
                <div>
                    <div data-hero>
                        <h1>Connect it automatically</h1>
                        <p className="lead">
                            DNS is the one part of this that trips people up. Tell us where the domain is registered and we hand you exactly what to paste, or a link that does it in one click.
                        </p>
                    </div>

                    <section className="registrar">
                        <h2>Where is the domain registered?</h2>
                        <p className="sm">We recognise most Nigerian and international registrars and give you their exact steps, field by field.</p>
                        <RegistrarPicker value={key} onChange={setKey} label="Choose your registrar" />
                    </section>

                    <div aria-live="polite">
                        {registrar?.oneClick && (
                            <div className="auto-card">
                                <span className="auto-ic"><BoltIcon /></span>
                                <span className="auto-body">
                                    <b>This registrar supports one-click setup</b>
                                    <p>Sign in at {name}, approve the change, and the four records are added for you. Nothing to copy.</p>
                                </span>
                                <Button href={route('onboarding.records', carry())}>Add the records</Button>
                            </div>
                        )}
                        {registrar && !registrar.oneClick && (
                            <div className="auto-card">
                                <span className="auto-ic"><CopyIcon /></span>
                                <span className="auto-body">
                                    <b>Copy the four records across</b>
                                    <p>We show each one with its own copy button and where it goes in {name}. It takes about two minutes.</p>
                                </span>
                                <Button href={route('onboarding.records', carry())}>Show me the records</Button>
                            </div>
                        )}
                    </div>

                    <Note title="We check until it works">
                        <p>Once the records are in, we look for them every few minutes and tell you the moment they pass. Most domains verify within the hour, some within seconds. You do not need to sit and watch.</p>
                    </Note>

                    <p className="assisted-foot sm">
                        Prefer to just read the values? <Link href={route('onboarding.records', carry())}>See all four records</Link>. They are the same either way.
                    </p>
                </div>

                <AsideCards items={asides} />
            </div>
        </>
    );
}

Assisted.layout = (page) => <OnboardingLayout step="records">{page}</OnboardingLayout>;

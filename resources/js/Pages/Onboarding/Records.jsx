import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import RecordTable from '../../Components/domain/RecordTable';
import RegistrarPicker from '../../Components/domain/RegistrarPicker';
import Button from '../../Components/ui/Button';
import AsideCards from '../../Components/ui/AsideCards';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

const asides = [
    {
        title: 'Your existing email is safe',
        body: 'Nothing changes until the MX record takes effect. Your current mailbox keeps receiving the whole time, so there is no window where your business cannot be reached.',
    },
    {
        title: 'Why we wait for all four',
        body: 'Other providers switch you on immediately and let you discover the spam problem yourself. We hold your mailboxes until every record passes, because that is the difference between reaching an inbox and not.',
    },
];

export default function Records() {
    const { domain, domainId, carry } = useOnboarding();
    const { records, checkedAt: checkedIso } = usePage().props;
    const { toast } = useToast();
    const [registrar, setRegistrar] = useState('');
    const [checking, setChecking] = useState(false);
    const checkedAt = checkedIso ? formatRelative(checkedIso).toLowerCase() : 'never';

    function check() {
        router.post(route('dashboard.domains.recheck', { domain: domainId }), {}, {
            preserveScroll: true,
            onStart: () => setChecking(true),
            onSuccess: (page) => {
                if (page.props.flash?.status === 'dns-unavailable') toast({ tone: 'warn', title: 'DNS checks are not connected yet', message: 'Your records have not been re-checked. We will check them automatically once the mail platform is connected.' });
            },
            onFinish: () => setChecking(false),
        });
    }
    const settled = records.length > 0 && records.every((r) => r.status === 'passing');
    const registrarName = onboardingFixture.registrars.find((r) => r.key === registrar)?.name;

    return (
        <>
            <Seo title="Add your DNS records | Ziroemail" description="Add four records to your domain so mail reaches the inbox." path="/onboarding/records" noindex />

            <div className="ob-grid">
                <div>
                    <div data-hero>
                        <h1>Add four records to your domain</h1>
                        <p className="lead">
                            Sign in wherever you bought <span className="mono">{domain}</span> and add the values below. Press Check records now once they are saved and we will tell you which ones pass.
                        </p>
                    </div>

                    <RecordTable records={records} checkedAt={checkedAt} checking={checking} onCheck={check} />

                    <section className="registrar">
                        <h2>Where did you buy this domain?</h2>
                        <p className="sm">Pick yours and we will show you exactly where these settings live.</p>
                        <RegistrarPicker value={registrar} onChange={setRegistrar} />
                        {registrarName && (
                            <Note className="registrar-note">
                                <p aria-live="polite">
                                    Sign in at {registrar === 'other' ? 'your registrar' : registrarName} and open the DNS settings for <span className="mono">{domain}</span>. Add the four records above, then press Check records now.
                                </p>
                            </Note>
                        )}
                    </section>

                    <div className="btn-row ob-actions">
                        {settled ? (
                            <Button href={route('onboarding.mailboxes', carry())}>Continue to mailboxes</Button>
                        ) : (
                            <Button onClick={check} busy={checking}>Check records now</Button>
                        )}
                        {!settled && <Button variant="line" href={route('onboarding.mailboxes', carry())}>Create mailboxes first</Button>}
                        <Button variant="line" href={route('onboarding.assisted', carry())}>Set it up automatically</Button>
                    </div>
                    <p className="hint" aria-live="polite">
                        {settled
                            ? 'All four records are live. Mail will start arriving immediately.'
                            : 'Records usually appear within 30 minutes of being saved at your registrar, though some take a few hours. Check whenever you are ready. Mail only starts arriving once all four pass, but you can create your mailboxes in the meantime.'}
                    </p>
                </div>

                <AsideCards items={asides}>
                    <section className="aside-card">
                        <h2>Stuck?</h2>
                        <p>Send us a screenshot of your DNS page on WhatsApp. We will tell you which field to change, and keep checking until it passes.</p>
                        <Button variant="line" full href={route('contact')}>Message us</Button>
                    </section>
                </AsideCards>
            </div>
        </>
    );
}

Records.layout = (page) => <OnboardingLayout step="records">{page}</OnboardingLayout>;

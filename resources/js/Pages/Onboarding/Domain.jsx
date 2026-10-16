import { useRef, useState } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import { CheckIcon, InfoIcon } from '../../Components/ui/Icons';
import AsideCards from '../../Components/ui/AsideCards';
import OptionCard, { OptionGroup } from '../../Components/ui/OptionCard';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import useQuery from '../../Hooks/useQuery';
import useOnboarding from '../../Hooks/useOnboarding';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { checkDomainInput } from '../../Lib/domain';
import { route } from '../../Lib/route';
import { simulateLatency } from '../../Lib/simulate';

const kinds = [
    {
        value: 'own',
        title: 'I already own it',
        description: 'Bought from Whogohost, GoDaddy, Namecheap or anywhere else. You keep it there and point its mail at us.',
    },
    {
        value: 'external',
        title: 'It is managed by someone else',
        description: 'Your web developer or agency holds the login. We will send them the records to add.',
    },
];

const asides = [
    {
        title: 'You keep your domain',
        body: 'We are not a registrar and we do not take ownership. Your domain stays exactly where you bought it, whether that is Whogohost, GoDaddy, Namecheap or somewhere else. You just point its mail at us.',
    },
    {
        title: 'Do not have a domain yet?',
        body: 'You need one before business email makes sense. Buy it from any registrar, which usually costs a few thousand naira a year, then come back here. Ask us if you want a recommendation.',
    },
    {
        title: 'One plan, one domain',
        body: 'This plan covers this domain only. If you run mail on a second domain later, it needs its own plan. Storage is never shared across domains.',
    },
];

export default function Domain() {
    const initial = useQuery().get('domain') ?? '';
    const { planCode } = useOnboarding();
    const formRef = useRef(null);
    const [kind, setKind] = useState('own');
    const [domain, setDomain] = useState(initial);
    const [manager, setManager] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    useFocusFirstError(formRef, error ? { domain: error } : {});

    async function onSubmit(e) {
        e.preventDefault();
        const { domain: clean, error: problem } = checkDomainInput(domain);
        setResult(null);
        if (problem) {
            setError(problem);
            return;
        }
        setError('');
        setDomain(clean);
        setChecking(true);
        await simulateLatency();
        setChecking(false);
        setResult({ domain: clean, ...onboardingFixture.domainCheck });
    }

    return (
        <>
            <Seo title="Your domain | Ziroemail" description="Tell us which domain your business email is for." path="/onboarding/domain" noindex />

            <div className="ob-grid">
                <div>
                    <div data-hero>
                        <h1>Which domain is this for?</h1>
                        <p className="lead">The name your customers already know you by. You keep it wherever you bought it. We only change where its mail is delivered.</p>
                    </div>

                    <form ref={formRef} onSubmit={onSubmit} noValidate>
                        <OptionGroup legend="Where is this domain now?">
                            {kinds.map((k) => (
                                <OptionCard key={k.value} name="domkind" value={k.value} checked={kind === k.value} onChange={setKind} title={k.title} description={k.description} />
                            ))}
                        </OptionGroup>

                        <div className="dom-field">
                            <Field label="Your domain" error={error} hint={<>Just the domain: no <span className="mono">www</span>, no <span className="mono">https://</span>, no email address.</>}>
                                {(p) => (
                                    <Input {...p} name="domain" type="text" placeholder="yourbusiness.com" autoComplete="off" spellCheck="false" autoCapitalize="off" value={domain} onChange={(e) => { setDomain(e.target.value); setError(''); setResult(null); }} />
                                )}
                            </Field>
                        </div>

                        {kind === 'external' && (
                            <Field label="Who manages it? (optional)" hint="We will email them the four records to add, and copy you in. You can also skip this and send the records on yourself.">
                                {(p) => <Input {...p} name="manager" type="email" placeholder="developer@agency.com" autoComplete="off" spellCheck="false" value={manager} onChange={(e) => setManager(e.target.value)} />}
                            </Field>
                        )}

                        <Button type="submit" size="lg" busy={checking}>Check this domain</Button>

                        {result && (
                            <div className="found" role="status">
                                <div className="found-row">
                                    <span className="found-ic found-ic-ok"><CheckIcon /></span>
                                    <span className="found-name">
                                        <b>{result.domain} is available to connect</b>
                                        <span>Not already set up with another Ziroemail account</span>
                                    </span>
                                </div>
                                <div className="found-row">
                                    <span className="found-ic found-ic-info"><InfoIcon size={13} /></span>
                                    <span className="found-name">
                                        <b>Your mail is handled by {result.currentProvider} today</b>
                                        <span>We read your MX records to work this out. Nothing has changed.</span>
                                    </span>
                                </div>
                                <div className="found-row found-foot">
                                    <span className="found-name sm">
                                        {result.importsMail && `We will import your existing mail from ${result.currentProvider.split(' ')[0]} once your records verify.`}
                                    </span>
                                    <Button size="sm" href={route('onboarding.plan', { domain: result.domain, plan: planCode })}>Continue to payment</Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <AsideCards items={asides} />
            </div>
        </>
    );
}

Domain.layout = (page) => <OnboardingLayout step="domain">{page}</OnboardingLayout>;

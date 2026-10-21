import { router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import AsideCards from '../../Components/ui/AsideCards';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { plans } from '../../fixtures/plans';
import { checkDomainInput } from '../../Lib/domain';
import { route } from '../../Lib/route';

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
    const { errors } = usePage().props;
    const formRef = useRef(null);
    const [domain, setDomain] = useState('');
    const [problem, setProblem] = useState('');
    const [saving, setSaving] = useState(false);
    const error = problem || errors.name || '';
    useFocusFirstError(formRef, error ? { domain: error } : {});

    function onSubmit(e) {
        e.preventDefault();
        const { domain: clean, error: invalid } = checkDomainInput(domain);
        if (invalid) {
            setProblem(invalid);
            return;
        }
        setProblem('');
        setDomain(clean);
        const plan = plans.find((p) => p.featured) ?? plans[0];
        router.post(route('onboarding.domain.store'), { name: clean, plan: plan.code }, {
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
        });
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
                        <div className="dom-field">
                            <Field label="Your domain" error={error} hint={<>Just the domain: no <span className="mono">www</span>, no <span className="mono">https://</span>, no email address.</>}>
                                {(p) => (
                                    <Input {...p} name="domain" type="text" placeholder="yourbusiness.com" autoComplete="off" spellCheck="false" autoCapitalize="off" value={domain} onChange={(e) => { setDomain(e.target.value); setProblem(''); }} />
                                )}
                            </Field>
                        </div>

                        <Button type="submit" size="lg" busy={saving}>Continue</Button>
                    </form>
                </div>

                <AsideCards items={asides} />
            </div>
        </>
    );
}

Domain.layout = (page) => <OnboardingLayout step="domain">{page}</OnboardingLayout>;

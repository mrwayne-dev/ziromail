import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import StrengthMeter from '../../Components/ui/StrengthMeter';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import usePricingState from '../../Hooks/usePricingState';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { plans } from '../../fixtures/plans';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';

const steps = [
    { title: 'Confirm your email', body: 'One click on the link we send you.' },
    {
        title: 'Connect your domain',
        body: 'We generate the exact records to paste, show you where they go in your registrar, and check them for you. Or hand it over and we will do it.',
    },
    {
        title: 'Add your staff',
        body: 'Create their mailboxes and send each person a setup link on WhatsApp. Their phone configures itself.',
    },
];

function ChosenPlan() {
    const query = useQuery();
    const { term, currency } = usePricingState();
    const plan = plans.find((p) => p.code === query.get('plan')) ?? plans.find((p) => p.featured);
    const yearly = term === 'annual';
    const amount = plan.price[currency][yearly ? 'yearly' : 'monthly'];

    return (
        <div className="chosen-plan">
            <div>
                <b>{plan.name} plan, {yearly ? 'yearly' : 'monthly'}</b>
                <span>{formatPrice(amount, currency)} per {yearly ? 'year' : 'month'} · {plan.poolGb} GB shared</span>
            </div>
            <Link href={route('pricing')}>Change</Link>
        </div>
    );
}

export default function Signup() {
    const plan = useQuery().get('plan') ?? '';
    const { passwordMinLength } = usePage().props.identity;
    const formRef = useRef(null);
    const form = useForm({ business: '', email: '', phone: '', password: '', terms: false, plan });
    const { errors } = form;
    useFocusFirstError(formRef, errors);

    const set = (key) => (e) => form.setData(key, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

    function onSubmit(e) {
        e.preventDefault();
        form.post(route('register'), { onFinish: () => form.reset('password') });
    }

    return (
        <>
            <Seo title="Create your account | Ziroemail" description="Create a Ziroemail account for your business. Your domain is set up in the next step." path="/signup" noindex />

            <div data-hero>
                <ChosenPlan />
                <h1>Create your account</h1>
                <p className="lead">This takes under a minute. You will connect your domain and add your staff in the next step.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                <Field label="Business name" error={errors.business}>
                    {(p) => <Input {...p} name="business" type="text" placeholder="Adaobi Foods Ltd" autoComplete="organization" value={form.data.business} onChange={set('business')} />}
                </Field>

                <Field label="Your work email" error={errors.email} hint="We send your receipt and setup link here. It can be your current address, even a Gmail one for now.">
                    {(p) => <Input {...p} name="email" type="email" placeholder="you@adaobifoods.com" autoComplete="email" spellCheck="false" value={form.data.email} onChange={set('email')} />}
                </Field>

                <Field label="WhatsApp number" error={errors.phone} hint="This is how we reach you about setup and renewals. We do not use it for marketing.">
                    {(p) => <Input {...p} name="phone" type="tel" placeholder="0803 000 0000" autoComplete="tel" value={form.data.phone} onChange={set('phone')} />}
                </Field>

                <Field label="Choose a password" error={errors.password} hint="Use something long that you do not use anywhere else.">
                    {(p) => (
                        <>
                            <Input {...p} name="password" type="password" placeholder={`At least ${passwordMinLength} characters`} autoComplete="new-password" value={form.data.password} onChange={set('password')} />
                            <StrengthMeter password={form.data.password} />
                        </>
                    )}
                </Field>

                <div className={`field${errors.terms ? ' field-err' : ''}`}>
                    <label className="check">
                        <input type="checkbox" name="terms" checked={form.data.terms} onChange={set('terms')} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? 'terms-err' : undefined} />
                        <span>
                            I agree to the <Link href={route('legal.terms')}>terms of service</Link>, the{' '}
                            <Link href={route('legal.aup')}>acceptable use policy</Link> and the{' '}
                            <Link href={route('legal.privacy')}>privacy policy</Link>.
                        </span>
                    </label>
                    {errors.terms && <p className="err" id="terms-err">{errors.terms}</p>}
                </div>

                <Button type="submit" size="lg" full busy={form.processing}>Create account</Button>

                <p className="legal-line">
                    We will never send marketing email to your customers, and we do not read your mail. Your account is only created once you confirm your address.
                </p>
            </form>

            <p className="auth-foot">Already have an account? <Link href={route('login')}>Sign in</Link></p>
        </>
    );
}

Signup.layout = (page) => (
    <AuthLayout
        variant="split"
        aside={(
            <>
                <span className="eyebrow">What happens next</span>
                <h2>Three steps and your business is running on Ziroemail</h2>
                <ul className="side-list">
                    {steps.map((step, i) => (
                        <li key={step.title}>
                            <span className="side-n" aria-hidden="true">{i + 1}</span>
                            <div>
                                <b>{step.title}</b>
                                <span>{step.body}</span>
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="side-quote">
                    Your mailboxes do not go live until your domain records check out. That is deliberate. It is the difference between mail that reaches the inbox and mail that lands in spam.
                </p>
            </>
        )}
    >
        {page}
    </AuthLayout>
);

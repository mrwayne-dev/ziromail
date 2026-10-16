import { onboardingFixture } from '../../fixtures/onboarding';

/*
 * "Where did you buy this domain?" as a grid of toggle buttons. Single choice;
 * `value` is the registrar key or ''. Choosing again does not clear it.
 */
export default function RegistrarPicker({ value, onChange, label = 'Choose your registrar' }) {
    return (
        <div className="reg-grid" role="group" aria-label={label}>
            {onboardingFixture.registrars.map((registrar) => (
                <button key={registrar.key} className="reg" type="button" aria-pressed={value === registrar.key} onClick={() => onChange(registrar.key)}>
                    {registrar.name}
                </button>
            ))}
        </div>
    );
}

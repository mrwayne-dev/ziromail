import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import { checkDomainInput } from '../../Lib/domain';
import { route } from '../../Lib/route';

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 8h13M8 1.5c1.8 2 2.6 4.2 2.6 6.5S9.8 12.5 8 14.5C6.2 12.5 5.4 10.3 5.4 8S6.2 3.5 8 1.5z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
);

/*
 * Domain field for the home page hero. It validates the shape of the domain and
 * says what is wrong in plain words. A valid domain goes straight into the
 * onboarding wizard's domain step, pre-filled, with no result screen in between:
 * the wizard's own "Check this domain" is where the lookup will live.
 */
export default function DomainSearch() {
    const id = useId();
    const errId = `${id}-err`;
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    function onSubmit(e) {
        e.preventDefault();
        const { domain, error: problem } = checkDomainInput(value);

        if (problem) {
            setError(problem);
            return;
        }

        setError('');
        setValue(domain);
        router.visit(route('onboarding.domain', { domain }));
    }

    return (
        <form className="domain-search" onSubmit={onSubmit} noValidate>
            <label className="sr-only" htmlFor={id}>Your domain</label>
            <div className={`domain-search-bar${error ? ' has-error' : ''}`}>
                <span className="domain-search-ic"><SearchIcon /></span>
                <input
                    id={id}
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="yourbusiness.com"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (error) setError('');
                    }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errId : undefined}
                />
                <button type="submit" className="btn btn-pri">Check domain</button>
            </div>
            {error && <p className="err domain-search-err" id={errId} role="alert">{error}</p>}
        </form>
    );
}

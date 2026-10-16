/*
 * Four bars that fill as a password gets harder to guess. It is a nudge, not a
 * rule: the only hard requirement is the length the form states. Scoring is
 * deliberately simple (length plus variety) so it never claims more than it knows.
 */
export function passwordScore(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 10) score += 1;
    if (password.length >= 14) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

const WORDS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

export default function StrengthMeter({ password }) {
    const score = passwordScore(password);

    return (
        <div className="strength">
            <div className="strength-bars" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => <i key={n} className={n <= score ? 'on' : undefined} />)}
            </div>
            <span className="sr-only" role="status">{password ? `Password strength: ${WORDS[score]}` : ''}</span>
        </div>
    );
}

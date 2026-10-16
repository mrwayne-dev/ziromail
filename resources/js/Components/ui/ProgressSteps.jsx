import { CheckIcon } from './Icons';

/*
 * A horizontal progress trail: numbered circles joined by a line. Steps before
 * `current` are done, the one at `current` is the page you are on. Used by the
 * onboarding wizard (numbers stay on done steps) and checkout (done steps show a
 * tick). Not interactive: moving between steps is the page's own links.
 */
export default function ProgressSteps({ steps, current, label = 'Progress', doneMarker = 'number' }) {
    const currentIndex = Math.max(0, steps.findIndex((step) => step.key === current));

    return (
        <ol className="steps" aria-label={label}>
            {steps.map((step, i) => {
                const state = i < currentIndex ? 'done' : i === currentIndex ? 'now' : '';
                return (
                    <li key={step.key} className="steps-item">
                        {i > 0 && <span className="step-line" aria-hidden="true" />}
                        <span className={`step ${state}`.trim()} aria-current={state === 'now' ? 'step' : undefined}>
                            <span className="n" aria-hidden="true">
                                {state === 'done' && doneMarker === 'tick' ? <CheckIcon size={12} /> : i + 1}
                            </span>
                            {step.label}
                            {state === 'done' && <span className="sr-only"> (done)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

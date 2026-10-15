import useReducedMotion from '../../Hooks/useReducedMotion';
import { MarkStroke } from './Marked';

/*
 * One word of a headline that rises into place. `index` staggers the words in
 * the order they appear. `marked` also sweeps the hand-drawn underline under
 * it; the underline lives on the same <i> the rise animates, as ziro.css expects.
 */
export default function Rise({ index = 0, marked = false, children }) {
    const reduced = useReducedMotion();
    return (
        <span className="rise">
            <i className={marked ? 'marked' : undefined} style={{ animationDelay: `${reduced ? 0 : 0.06 * index + 0.1}s` }}>
                {children}
                {marked && <MarkStroke />}
            </i>
        </span>
    );
}

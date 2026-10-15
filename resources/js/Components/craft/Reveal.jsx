import { useRef } from 'react';
import useReveal from '../../Hooks/useReveal';

/*
 * Wraps an element so it fades in as it scrolls into view.
 *   dir      'left' | 'right' | 'scale' — enter from a side instead of below
 *   stagger  reveal the direct children one after another instead of the element
 *   delay    1 | 2 — small extra delay for side-by-side elements
 * The data attributes are what ziro.css styles; `in` is added once visible.
 */
export default function Reveal({
    as: Tag = 'div',
    dir,
    stagger = false,
    delay,
    className = '',
    children,
    ...rest
}) {
    const ref = useRef(null);
    const shown = useReveal(ref);

    const attrs = stagger
        ? { 'data-stagger': '' }
        : { 'data-reveal': dir ?? '', 'data-delay': delay };

    const classes = [className, shown ? 'in' : ''].filter(Boolean).join(' ');

    return (
        <Tag ref={ref} className={classes || undefined} {...attrs} {...rest}>
            {children}
        </Tag>
    );
}

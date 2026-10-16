/*
 * A choice presented as a card, built on a real radio input so it keeps native
 * keyboard and form behaviour. Wrap a set in <OptionGroup>.
 *   icon        node shown in a tile before the text
 *   badge       short pill after the title
 *   aside       node at the far end of the title row (a price)
 *   detail      shown only while this card is selected
 *   radio       'start' or 'end': which side the radio dot sits on
 */
export function OptionGroup({ legend, hideLegend = false, className = '', children }) {
    return (
        <fieldset className={`opts ${className}`.trim()}>
            <legend className={hideLegend ? 'sr-only' : 'label'}>{legend}</legend>
            {children}
        </fieldset>
    );
}

export default function OptionCard({
    name,
    value,
    checked,
    onChange,
    icon,
    title,
    badge,
    aside,
    description,
    detail,
    radio = 'start',
}) {
    const dot = <span className="opt-dot" aria-hidden="true" />;

    return (
        <label className={`opt${checked ? ' is-checked' : ''}`}>
            <input className="opt-input" type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
            <span className="opt-main">
                {radio === 'start' && dot}
                {icon && <span className="opt-ic" aria-hidden="true">{icon}</span>}
                <span className="opt-text">
                    <span className="opt-head">
                        <span className="opt-title">
                            {title}
                            {badge && <span className="pill pill-info">{badge}</span>}
                        </span>
                        {aside && <span className="opt-aside">{aside}</span>}
                    </span>
                    {description && <span className="opt-desc">{description}</span>}
                </span>
                {radio === 'end' && dot}
            </span>
            {detail && checked && <span className="opt-detail">{detail}</span>}
        </label>
    );
}

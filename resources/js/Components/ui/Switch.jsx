import { useId } from 'react';

/*
 * A labelled on/off row. The control is a real checkbox exposed as a switch, so
 * keyboard and screen readers get Space to toggle and "on / off" announced.
 */
export default function Switch({ label, description, checked, onChange, disabled = false, name }) {
    const id = useId();

    return (
        <div className="sw-row">
            <div className="tx">
                <b id={`${id}-l`}>{label}</b>
                {description && <span id={`${id}-d`}>{description}</span>}
            </div>
            <label className="sw">
                <input
                    type="checkbox"
                    role="switch"
                    name={name}
                    checked={checked}
                    disabled={disabled}
                    aria-label={label}
                    aria-describedby={description ? `${id}-d` : undefined}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="tr" aria-hidden="true" />
            </label>
        </div>
    );
}

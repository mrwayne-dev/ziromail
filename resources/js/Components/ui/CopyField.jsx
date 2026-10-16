import { useId } from 'react';
import useCopy from '../../Hooks/useCopy';
import { useToast } from './Toast';

/*
 * A read-only value with a Copy button: DNS records, server settings, an account
 * number. The value is real text in a <code> element so it can also be selected by hand.
 */
export default function CopyField({ label, value, hint, plain = false, kind = 'field', className = '' }) {
    const id = useId();
    const { copied, copy } = useCopy();
    const { toast } = useToast();

    async function onCopy() {
        const ok = await copy(value);
        if (!ok) {
            toast({ tone: 'warn', title: 'Could not copy', message: 'Select the value and copy it by hand.' });
        }
    }

    return (
        <div className={`copyfield ${className}`.trim()}>
            {label && (kind === 'field' ? <span className="k" id={`${id}-k`}>{label}</span> : <p className="label" id={`${id}-k`}>{label}</p>)}
            <div className="copyrow">
                <code aria-labelledby={label ? `${id}-k` : undefined} className={plain ? 'copy-plain' : undefined}>{value}</code>
                <button type="button" className="btn btn-line btn-sm" onClick={onCopy} aria-label={label ? `Copy ${label.toLowerCase()}` : 'Copy'}>
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <span className="sr-only" role="status">{copied ? 'Copied to clipboard' : ''}</span>
            {hint && <p className="hint">{hint}</p>}
        </div>
    );
}

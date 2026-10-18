import { useMemo } from 'react';
import useCopy from '../../Hooks/useCopy';
import Button from '../ui/Button';

/*
 * The one moment recovery codes are shown. After this screen only the count of
 * unused codes can ever be seen again, so the list offers Copy and Download
 * and says so.
 */
export default function RecoveryCodesList({ codes }) {
    const { copied, copy } = useCopy();
    const text = useMemo(() => codes.join('\n'), [codes]);

    function download() {
        const url = URL.createObjectURL(new Blob([`Ziroemail recovery codes\nEach code works once.\n\n${text}\n`], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ziroemail-recovery-codes.txt';
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="recovery-codes">
            <ul className="rc-grid" aria-label="Your recovery codes">
                {codes.map((code) => <li key={code}><code>{code}</code></li>)}
            </ul>
            <div className="btn-row rc-actions">
                <Button variant="line" size="sm" onClick={() => copy(text)}>{copied ? 'Copied' : 'Copy all'}</Button>
                <Button variant="line" size="sm" onClick={download}>Download</Button>
            </div>
            <p className="hint">Each code works once. We cannot show them again, so keep them somewhere safe, away from this device.</p>
        </div>
    );
}

import { usePage } from '@inertiajs/react';
import Banner from './Banner';
import { InfoIcon } from './Icons';

/*
 * One line on the signed-in screens while the organisation behind them is
 * demonstration data. The person signed in is real; the business shown is not.
 * Driven by the shared `site.prototype` prop and gone once it is false.
 */
export default function PrototypeNotice() {
    const { site } = usePage().props;
    if (!site.prototype) return null;

    return (
        <Banner tone="info" className="proto-notice" icon={<InfoIcon />}>
            Preview. The business, domains and mailboxes shown here are demonstration data. Your sign-in and security settings are real.
        </Banner>
    );
}

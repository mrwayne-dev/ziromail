import { router, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import AuditTable from '../../Components/dashboard/AuditTable';
import Button from '../../Components/ui/Button';
import Empty from '../../Components/ui/Empty';
import Note from '../../Components/ui/Note';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

const CATEGORIES = [['all', 'Everything'], ['mailboxes', 'Mailboxes'], ['storage', 'Storage'], ['billing', 'Billing'], ['access', 'Access'], ['domain', 'Domain']];

export default function Audit() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { domain: ['rows'], mailbox: ['rows'], security: ['rows'] } });

    const { filter, entries, retentionMonths } = usePage().props;
    const exportUrl = filter === 'all' ? route('dashboard.audit.export') : `${route('dashboard.audit.export')}?filter=${filter}`;
    const choose = (key) => router.get(route('dashboard.audit'), key === 'all' ? {} : { filter: key }, { preserveScroll: true, preserveState: true });

    return (
        <DashboardLayout page="admin-audit" title="Activity log" description="Everything that changed on this account, and who changed it.">
            <div className="page-head">
                <div>
                    <h1>Activity log</h1>
                    <p>Everything that changed on this account, and who changed it.</p>
                </div>
                <a className="btn btn-line" href={exportUrl} download>Export as CSV</a>
            </div>

            <div className="filters" role="group" aria-label="Filter the log">
                {CATEGORIES.map(([key, label]) => (
                    <button type="button" key={key} aria-pressed={filter === key} onClick={() => choose(key)}>{label}</button>
                ))}
            </div>

            {entries.length === 0 ? (
                <Empty icon="✓" title="Nothing here yet">No changes in this category.</Empty>
            ) : (
                <AuditTable entries={entries} />
            )}

            <Note title="What is recorded, and for how long" className="mt-l">
                <p>
                    Every change to mailboxes, storage, billing, access and domain records, kept for {retentionMonths} months. We record
                    that something changed and who did it, never the contents of anybody's mail.
                </p>
            </Note>
        </DashboardLayout>
    );
}

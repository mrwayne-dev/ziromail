import { router, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import AuditTable from '../../Components/dashboard/AuditTable';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import SectionHeader from '../../Components/ui/SectionHeader';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

const CATEGORIES = [['all', 'Everything'], ['mailboxes', 'Mailboxes'], ['storage', 'Storage'], ['billing', 'Billing'], ['access', 'Access'], ['domain', 'Domain']];

export default function Audit() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { domain: ['rows'], mailbox: ['rows'], security: ['rows'] } });

    const { filter, entries, retentionMonths } = usePage().props;
    const exportUrl = filter === 'all' ? route('dashboard.audit.export') : `${route('dashboard.audit.export')}?filter=${filter}`;
    const choose = (key) => router.get(route('dashboard.audit'), key === 'all' ? {} : { filter: key }, { preserveScroll: true, preserveState: true });

    const chips = CATEGORIES.map(([key, label]) => ({
        value: key,
        label,
        pressed: filter === key,
        onClick: () => choose(key),
    }));

    return (
        <DashboardLayout page="admin-audit" title="Activity log" description="Everything that changed on this account, and who changed it.">
            <SectionHeader
                title="Activity log"
                description="Everything that changed on this account, and who changed it."
                actions={<Button variant="line" size="sm" href={exportUrl} download>Export as CSV</Button>}
            />

            <AuditTable
                entries={entries}
                toolbar={{ caption: 'Activity log', chips }}
            />

            <Note title="What is recorded, and for how long" className="mt-l">
                <p>
                    Every change to mailboxes, storage, billing, access and domain records, kept for {retentionMonths} months. We record
                    that something changed and who did it, never the contents of anybody's mail.
                </p>
            </Note>
        </DashboardLayout>
    );
}

import { useState } from 'react';
import AuditTable from '../../Components/dashboard/AuditTable';
import Button from '../../Components/ui/Button';
import Empty from '../../Components/ui/Empty';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import useScenario from '../../Hooks/useScenario';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { auditProps, CATEGORIES } from '../../fixtures/dashboard';

export default function Audit() {
    const scenario = useScenario();
    const [filter, setFilter] = useState('all');
    const { entries, retentionMonths } = auditProps(filter, scenario);
    const { toast } = useToast();

    return (
        <DashboardLayout page="admin-audit" title="Activity log" description="Everything that changed on this account, and who changed it.">
            <div className="page-head">
                <div>
                    <h1>Activity log</h1>
                    <p>Everything that changed on this account, and who changed it.</p>
                </div>
                <Button variant="line" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet', message: 'In the live product this downloads the filtered log as a CSV file.' })}>Export as CSV</Button>
            </div>

            <div className="filters" role="group" aria-label="Filter the log">
                {CATEGORIES.map(([key, label]) => (
                    <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
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

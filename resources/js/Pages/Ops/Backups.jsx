import { useState } from 'react';
import DataTable from '../../Components/ui/DataTable';
import { MetricRow } from '../../Components/ui/MetricTile';
import NightStrip from '../../Components/ops/NightStrip';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Field from '../../Components/ui/Field';
import { AlertIcon } from '../../Components/ui/Icons';
import Select from '../../Components/ui/Select';
import { useToast } from '../../Components/ui/Toast';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { backupFigures, backupNights, restores, snapshots } from '../../fixtures/ops';
import { formatDate, formatTime } from '../../Lib/format';

export default function Backups() {
    const { toast } = useToast();
    const can = useOpsCan();
    const [snapshotId, setSnapshotId] = useState(null);
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const chosen = snapshots.find((snapshot) => snapshot.id === snapshotId) ?? snapshots[1];

    const tiles = backupFigures.map((row) => ({ k: row.k, v: row.v, d: row.d, tone: row.alert ? 'bad' : null }));

    function confirm(reason) {
        setRequests((list) => [{ id: `rq_${list.length}`, what: 'Restore requested', orgName: 'Awaiting runbook', from: chosen.takenAt, askedBy: 'You', outcome: 'Requested', reason }, ...list]);
        setOpen(false);
        toast({ tone: 'ok', title: 'Restore requested', message: 'Preview: this records the request and points to the runbook. It does not run a restore.' });
    }

    return (
        <OpsLayout page="ops-backups" title="Backups">
            <SectionHeader
                title="Backups and restores"
                description="Nightly snapshots, and proof they can actually be restored. An untested backup is a guess, so one is restored at random every night."
                actions={can('restore') ? <Button variant="line" size="sm" onClick={() => { setSnapshotId(null); setOpen(true); }}>Start a restore</Button> : null}
            />

            <MetricRow items={tiles} label="Backup figures" />

            <SubSection id="tl-h" title="Last 30 nights" description="Green completed and verified, amber completed but slow, red failed.">
                <section className="ops-card">
                    <NightStrip nights={backupNights} lastNight="2026-09-29" />
                    <div className="ops-axis-row">
                        <span>31 Aug</span><span>Failed 8 Sep &middot; slow 12 Sep</span><span>29 Sep</span>
                    </div>
                    <p className="ops-sm ops-mut mt-10">The 8 September failure was a full disk on the backup target, caught by the 03:00 alert and re-run successfully at 05:20 the same morning. The window where no fresh backup existed was three hours; the previous night's copy was intact throughout.</p>
                </section>
            </SubSection>

            <SubSection id="sn-h" title="Recent snapshots">
                <DataTable
                    columns={[
                        { id: 'at', header: 'Taken', accessor: (row) => `${formatDate(row.takenAt, { year: false })}, ${formatTime(row.takenAt)}`, nowrap: true, align: 'num', sortable: true, sortValue: (row) => row.takenAt },
                        { id: 'kind', header: 'Kind', accessor: (row) => row.kind === 'monthly' ? 'Monthly' : 'Full' },
                        { id: 'mailboxes', header: 'Mailboxes', accessor: (row) => row.mailboxCount.toLocaleString('en-NG'), align: 'num' },
                        { id: 'note', header: 'Note', accessor: (row) => row.note },
                        { id: 'size', header: 'Size', accessor: (row) => `${row.sizeTb} TB`, align: 'num', sortable: true, sortValue: (row) => row.sizeTb },
                    ]}
                    rows={snapshots}
                    rowKey={(row) => row.id}
                    renderActions={(row) => can('restore')
                        ? <Button variant="line" size="sm" onClick={() => { setSnapshotId(row.id); setOpen(true); }}>Restore</Button>
                        : <Button variant="line" size="sm" disabled title="Only Engineers and Owners can start a restore">Restore</Button>}
                />
            </SubSection>

            <SubSection id="rs-h" title="Restores performed" description="Real restores for customers, as distinct from the nightly tests.">
                <DataTable
                    columns={[
                        { id: 'what', header: 'What', accessor: (row) => row.what },
                        { id: 'org', header: 'Organisation', accessor: (row) => row.orgName },
                        { id: 'from', header: 'From', accessor: (row) => formatDate(row.from, { year: false }), align: 'num', nowrap: true },
                        { id: 'by', header: 'Asked by', accessor: (row) => row.askedBy },
                        { id: 'outcome', header: 'Outcome', accessor: (row) => <span className={`ops-pill ${row.outcome === 'Requested' ? 'watch' : 'ok'}`}>{row.outcome}</span> },
                    ]}
                    rows={[...requests, ...restores]}
                    rowKey={(row) => row.id}
                    emptyState={{ title: 'No customer restores yet' }}
                />
            </SubSection>

            <Banner tone="warn" icon={<AlertIcon />} title="Restoring overwrites" className="mt-l">
                <p>A restore puts the snapshot's contents back in place. Anything received since that snapshot is kept, but anything the customer deleted since then comes back too. Say this out loud to the customer before starting, and take the restore from the most recent snapshot that predates whatever went wrong, not simply the newest one.</p>
            </Banner>

            <ReasonDialog open={open} onClose={() => setOpen(false)} title="Start a restore" description="Pick the snapshot. This records the request and links the runbook; the restore itself is run by an engineer." confirmLabel="Request the restore" tone="danger" onConfirm={confirm}>
                <Field label="Snapshot">{(props) => <Select {...props} value={chosen.id} onChange={(e) => setSnapshotId(e.target.value)}>{snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{formatDate(snapshot.takenAt, { year: false })}, {formatTime(snapshot.takenAt)} ({snapshot.kind})</option>)}</Select>}</Field>
            </ReasonDialog>
        </OpsLayout>
    );
}

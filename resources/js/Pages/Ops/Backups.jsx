import { useState } from 'react';
import Metrics from '../../Components/ops/Metrics';
import NightStrip from '../../Components/ops/NightStrip';
import OpsTable from '../../Components/ops/OpsTable';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Field from '../../Components/ui/Field';
import { AlertIcon } from '../../Components/ui/Icons';
import Pill from '../../Components/ui/Pill';
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

    function confirm(reason) {
        setRequests((list) => [{ id: `rq_${list.length}`, what: 'Restore requested', orgName: 'Awaiting runbook', from: chosen.takenAt, askedBy: 'You', outcome: 'Requested', reason }, ...list]);
        setOpen(false);
        toast({ tone: 'ok', title: 'Restore requested', message: 'Preview: this records the request and points to the runbook. It does not run a restore.' });
    }

    return (
        <OpsLayout page="ops-backups" title="Backups">
            <div className="ops-head">
                <div>
                    <h1>Backups and restores</h1>
                    <p>Nightly snapshots, and proof they can actually be restored. An untested backup is a guess, so one is restored at random every night.</p>
                </div>
                {can('restore') && <Button variant="line" size="sm" onClick={() => { setSnapshotId(null); setOpen(true); }}>Start a restore</Button>}
            </div>

            <Metrics items={backupFigures} label="Backup figures" />

            <section aria-labelledby="tl-h" className="mt-l">
                <h2 id="tl-h">Last 30 nights</h2>
                <p className="sm mut mt-s">Green completed and verified, amber completed but slow, red failed. Hover a night for its date.</p>
                <Card className="mt">
                    <NightStrip nights={backupNights} lastNight="2026-09-29" />
                    <div className="tl-ax"><span>31 Aug</span><span>Failed 8 Sep &middot; slow 12 Sep</span><span>29 Sep</span></div>
                    <p className="hint">The 8 September failure was a full disk on the backup target, caught by the 03:00 alert and re-run successfully at 05:20 the same morning. The window where no fresh backup existed was three hours; the previous night's copy was intact throughout.</p>
                </Card>
            </section>

            <section aria-labelledby="sn-h" className="mt-l">
                <h2 id="sn-h">Recent snapshots</h2>
                <div className="snap mt">
                    {snapshots.map((snapshot) => (
                        <div className="s" key={snapshot.id}>
                            <span className="dt">{formatDate(snapshot.takenAt, { year: false })}, {formatTime(snapshot.takenAt)}</span>
                            <span className="mid">{snapshot.kind === 'monthly' ? 'Monthly' : 'Full'} &middot; {snapshot.mailboxCount.toLocaleString('en-NG')} mailboxes &middot; {snapshot.note}</span>
                            <span className="sz">{snapshot.sizeTb} TB</span>
                            {can('restore')
                                ? <Button variant="line" size="sm" aria-label={`Restore from ${formatDate(snapshot.takenAt, { year: false })}`} onClick={() => { setSnapshotId(snapshot.id); setOpen(true); }}>Restore from this</Button>
                                : <Button variant="line" size="sm" disabled title="Only Engineers and Owners can start a restore">Restore from this</Button>}
                        </div>
                    ))}
                </div>
            </section>

            <section aria-labelledby="rs-h" className="mt-l">
                <h2 id="rs-h">Restores performed</h2>
                <p className="sm mut mt-s">Real restores for customers, as distinct from the nightly tests.</p>
                <OpsTable
                    className="mt"
                    wide
                    caption="Customer restore requests"
                    head={<tr><th scope="col">What</th><th scope="col">Organisation</th><th scope="col">From</th><th scope="col">Asked by</th><th scope="col">Outcome</th></tr>}
                >
                    {[...requests, ...restores].map((row) => (
                        <tr key={row.id}>
                            <td className="wide">{row.what}</td>
                            <td>{row.orgName}</td>
                            <td className="num">{formatDate(row.from, { year: false })}</td>
                            <td>{row.askedBy}</td>
                            <td><Pill tone={row.outcome === 'Requested' ? 'warn' : 'ok'}>{row.outcome}</Pill></td>
                        </tr>
                    ))}
                </OpsTable>
            </section>

            <Banner tone="warn" icon={<AlertIcon />} title="Restoring overwrites" className="mt-l">
                <p>A restore puts the snapshot's contents back in place. Anything received since that snapshot is kept, but anything the customer deleted since then comes back too. Say this out loud to the customer before starting, and take the restore from the most recent snapshot that predates whatever went wrong, not simply the newest one.</p>
            </Banner>

            <ReasonDialog open={open} onClose={() => setOpen(false)} title="Start a restore" description="Pick the snapshot. This records the request and links the runbook; the restore itself is run by an engineer." confirmLabel="Request the restore" tone="danger" onConfirm={confirm}>
                <Field label="Snapshot">{(props) => <Select {...props} value={chosen.id} onChange={(e) => setSnapshotId(e.target.value)}>{snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{formatDate(snapshot.takenAt, { year: false })}, {formatTime(snapshot.takenAt)} ({snapshot.kind})</option>)}</Select>}</Field>
            </ReasonDialog>
        </OpsLayout>
    );
}

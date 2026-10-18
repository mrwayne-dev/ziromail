import { useState } from 'react';
import Metrics from '../../Components/ops/Metrics';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import RecordStrip from '../../Components/ops/RecordStrip';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import { AlertIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import OpsLayout from '../../Layouts/OpsLayout';
import { brokenDomains, domainFigures, stuckDomains } from '../../fixtures/ops';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';

export default function Domains() {
    const { toast } = useToast();
    const [busy, setBusy] = useState(false);
    const atRisk = stuckDomains.reduce((sum, row) => sum + row.paid.minor, 0);

    function recheck() {
        setBusy(true);
        setTimeout(() => { setBusy(false); toast({ tone: 'ok', title: 'Re-check queued', message: 'Preview: nothing was queued. The live product re-checks every live domain, rate limited.' }); }, 700);
    }

    return (
        <OpsLayout page="ops-domains" title="Domain status">
            <div className="ops-head">
                <div>
                    <h1>Domain status</h1>
                    <p>DNS state for all 412 customer domains. Incomplete setups first: those are the accounts most likely to churn or ask for a refund.</p>
                </div>
                <Button variant="line" size="sm" busy={busy} onClick={recheck}>Re-check all records</Button>
            </div>

            <Metrics items={domainFigures} label="Domain figures" />

            <Banner tone="warn" live icon={<AlertIcon />} title={`${brokenDomains.length} domains that were working have stopped`} className="mt">
                <p>Records that verified before are now missing. Usually a domain transfer to a new registrar, or a web developer replacing the zone file. Telephone these: their mail is not being delivered right now and they may not know.</p>
            </Banner>

            <section aria-labelledby="br-h" className="mt-l">
                <h2 id="br-h">Records that stopped working</h2>
                <OpsTable
                    className="mt"
                    caption="Domains whose DNS records were previously verified and are now missing"
                    head={<tr><th scope="col">Domain</th><th scope="col">Organisation</th><th scope="col">Records</th><th scope="col" className="num">Broken since</th><th scope="col"><span className="sr-only">Action</span></th></tr>}
                >
                    {brokenDomains.map((row) => (
                        <tr key={row.domain} className={severityClass(row.severity)}>
                            <td className="mono">{row.domain}</td>
                            <td className="wide">{row.organisation}</td>
                            <td><RecordStrip records={row.records} /></td>
                            <td className="num">{row.brokenFor}</td>
                            <td><Button variant={row.severity === 'high' ? 'primary' : 'line'} size="sm" href={route('ops.orgs.show', { org: row.orgId })}>{row.severity === 'high' ? 'Call them' : 'Open'}</Button></td>
                        </tr>
                    ))}
                </OpsTable>
            </section>

            <section aria-labelledby="ns-h" className="mt-l">
                <div className="between"><h2 id="ns-h">Never finished setup</h2><Pill tone="bad">11 domains &middot; {formatPrice(atRisk, 'NGN')} in this list</Pill></div>
                <p className="sm mut mt-s">Paid for, but mail has never flowed. Every day here makes a refund request more likely. The registrar column tells you which instructions to read out.</p>
                <OpsTable
                    className="mt"
                    wide
                    caption="Paid domains where DNS setup was never completed"
                    head={<tr><th scope="col">Domain</th><th scope="col">Records</th><th scope="col">Registrar</th><th scope="col" className="num">Paid</th><th scope="col" className="num">Waiting</th><th scope="col"><span className="sr-only">Action</span></th></tr>}
                >
                    {stuckDomains.map((row) => (
                        <tr key={row.domain} className={severityClass(row.severity)}>
                            <td className="mono wide">{row.domain}</td>
                            <td><RecordStrip records={row.records} /></td>
                            <td>{row.registrar}</td>
                            <td className="num">{formatPrice(row.paid.minor, row.paid.currency)}</td>
                            <td className="num">{row.daysWaiting} days</td>
                            <td><Button variant={row.severity === 'high' ? 'primary' : 'line'} size="sm" href={route('ops.orgs.show', { org: row.orgId })}>{row.severity === 'high' ? 'Call' : 'Open'}</Button></td>
                        </tr>
                    ))}
                </OpsTable>
                <p className="hint">DMARC shown in grey is not yet required: we only ask for it once MX, SPF and DKIM verify. A domain is counted as finished without it.</p>
                <Note title="Most of these never opened the records page" className="mt">
                    <p>Where a customer gives us registrar access, setup takes minutes instead of days. Nine of the eleven unfinished domains never reached the records step at all. Worth asking on the call where they stopped: that is a product problem we can fix.</p>
                </Note>
            </section>
        </OpsLayout>
    );
}

import { usePage } from '@inertiajs/react';
import AddDomainDialog from '../../Components/dashboard/AddDomainDialog';
import Button from '../../Components/ui/Button';
import Meter from '../../Components/ui/Meter';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import useDisclosure from '../../Hooks/useDisclosure';
import useQuery from '../../Hooks/useQuery';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatDate, formatGb, pluralise } from '../../Lib/format';
import { route } from '../../Lib/route';

const PLAN_NAME = { starter: 'Starter', business: 'Business', premium: 'Premium' };

export default function Domains() {
    const query = useQuery();
    const { domains, canAddDomain } = usePage().props;
    const dialog = useDisclosure(query.get('add') === '1' || window.location.hash === '#add');
    return (
        <DashboardLayout page="admin-domains" title="Your domains" description="Every domain on this account, its plan and its storage.">
            <div className="page-head">
                <div>
                    <h1>Your domains</h1>
                    <p>Each domain carries its own plan and its own storage pool. Nothing is shared between them.</p>
                </div>
                {canAddDomain && <Button onClick={dialog.open}>Add a domain</Button>}
            </div>

            <section className="dom-list" aria-labelledby="est-h">
                <h2 id="est-h" className="sr-only">Domains on this account</h2>
                {domains.map((domain) => {
                    const healthy = domain.recordsPassing === domain.recordsTotal;
                    const share = Math.round((domain.usedGb / domain.poolGb) * 100);
                    return (
                        <article className="dom-card" key={domain.id}>
                            <div className="dom-id">
                                <span className="nm">{domain.name}</span>
                                <span className="sub">
                                    <Pill tone={healthy ? 'ok' : 'warn'}>{healthy ? 'All records passing' : domain.healthNote}</Pill>
                                    <span>{pluralise(domain.mailboxCount, 'mailbox', 'mailboxes')}</span>
                                    {domain.renewsAt && <span>Renews {formatDate(domain.renewsAt)}</span>}
                                </span>
                            </div>
                            <div className="dom-pool">
                                <span className="k">{PLAN_NAME[domain.planCode] ?? 'No plan yet'} &middot; storage</span>
                                <span className="v">{formatGb(domain.usedGb)} of {formatGb(domain.poolGb)} used</span>
                                <Meter used={domain.usedGb} total={domain.poolGb} label={`${formatGb(domain.usedGb)} of ${formatGb(domain.poolGb)} used, ${share} per cent`} />
                            </div>
                            <div className="dom-acts">
                                <Button variant={healthy ? 'line' : 'primary'} size="sm" href={`${route('dashboard.domains.show', { domain: domain.id })}?domain=${domain.id}`}>{healthy ? 'Manage' : 'Fix records'}</Button>
                                <Button variant="line" size="sm" href={`${route('dashboard.billing')}?domain=${domain.id}`}>Billing</Button>
                            </div>
                        </article>
                    );
                })}
            </section>

            <Note title="Why each domain needs its own plan" className="mt-l note-narrow">
                <p>
                    Storage is pooled per domain, not per account. That keeps the pricing honest: a domain with two mailboxes never
                    subsidises one with forty, and you can put a small plan on a side business without paying for it twice. Mailboxes
                    stay unlimited on every plan.
                </p>
            </Note>

            <AddDomainDialog open={dialog.isOpen} onClose={dialog.close} />
        </DashboardLayout>
    );
}

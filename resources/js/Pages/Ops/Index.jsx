import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ActivityFeed from '../../Components/ops/ActivityFeed';
import DataTable from '../../Components/ops/DataTable';
import { MetricRow } from '../../Components/ops/MetricTile';
import SectionHeader, { SubSection } from '../../Components/ops/SectionHeader';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import OpsLayout from '../../Layouts/OpsLayout';
import { route } from '../../Lib/route';

const NOT_CONNECTED = { v: 'Not connected', tone: 'off', d: 'needs the mail server' };

export default function Index() {
    useRealtimeReload({ channel: 'ops', map: { users: ['figures', 'feed', 'stuckDomains'], mailboxes: ['figures', 'feed'], abuse: ['feed'], 'mail-events': ['figures'] } });

    const { figures, stuckDomains, feed } = usePage().props;
    const [query, setQuery] = useState('');

    const tiles = [
        { k: 'Users', v: figures.users, d: `+${figures.usersWeek} this week`, delta: { value: figures.usersWeek, label: `${figures.usersWeek} new users this week` } },
        { k: 'Domains', v: figures.domains, d: `${figures.liveDomains} live` },
        { k: 'Mailboxes', v: figures.mailboxes, d: `+${figures.mailboxesWeek} this week`, delta: { value: figures.mailboxesWeek } },
        { k: 'Storage assigned', v: figures.assignedGb, unit: 'GB', d: `${figures.usedGb} GB used` },
        { k: 'Mail in 24h', ...NOT_CONNECTED },
        { k: 'Bounce rate', ...NOT_CONNECTED },
    ];

    return (
        <OpsLayout page="ops" title="Overview">
            <SectionHeader
                title="Operations overview"
                description="Counted from our own records. Anything that needs the mail server shows as not connected until it is."
                actions={<>
                    <Button variant="line" size="sm" href={route('ops.audit')}>Audit trail</Button>
                    <Button size="sm" href={route('ops.users')}>Find an account</Button>
                </>}
            />

            <MetricRow items={tiles} label="Platform figures" />

            <div className="ops-row2 mt-24">
                <div className="ops-stack">
                    <SubSection
                        id="dn-h"
                        title="Domains not live yet"
                        description="Added, but not yet verified and paid. The longest waiting come first."
                        tLink={{ href: route('ops.domains'), label: 'All domains' }}
                    >
                        <DataTable
                            columns={[
                                { id: 'name', header: 'Domain', accessor: (r) => r.domain, mono: true, sortable: true },
                                { id: 'organisation', header: 'Held by', accessor: (r) => r.organisation, sortable: true },
                                { id: 'missing', header: 'Missing', accessor: (r) => `${r.missing.length ? r.missing.join(', ') : 'Nothing'}${r.paid ? '' : ' (unpaid)'}` },
                                { id: 'daysWaiting', header: 'Waiting', accessor: (r) => `${r.daysWaiting} days`, align: 'num', sortable: true, sortValue: (r) => r.daysWaiting },
                            ]}
                            rows={stuckDomains}
                            rowKey={(r) => r.domain}
                            rowHref={(r) => route('ops.users.show', { user: r.ownerId })}
                            emptyState={{ title: 'Every domain is live', body: 'Nothing is waiting on records or payment.' }}
                        />
                    </SubSection>

                    <Note title="Not connected yet">
                        <p>Deliverability, the delivery queue, blocklists, abuse flags, backups and support load need the mail server, the sending provider and the backup system. Their pages show real zero figures until the mail server is connected.</p>
                    </Note>
                </div>

                <div className="ops-stack">
                    <section className="ops-card" aria-labelledby="find-h">
                        <h2 className="ops-card-h" id="find-h">Find an account</h2>
                        <p className="ops-card-lede">Matches a business name, email address, domain name or mailbox address.</p>
                        <form onSubmit={(e) => { e.preventDefault(); router.get(route('ops.users'), { q: query }); }} className="mt-12">
                            <label className="sr-only" htmlFor="ops-q">Search by domain, email address or business name</label>
                            <input className="input" type="search" id="ops-q" autoComplete="off" spellCheck="false" placeholder="Domain, address or business name" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <Button type="submit" full className="mt-s">Search</Button>
                        </form>
                    </section>

                    <section className="ops-card" aria-labelledby="feed-h">
                        <div className="ops-flex-between">
                            <h2 className="ops-card-h" id="feed-h">Recent activity</h2>
                            <Link className="tlink" href={route('ops.audit')}>Audit trail</Link>
                        </div>
                        <div className="mt-10">
                            <ActivityFeed items={feed} />
                        </div>
                    </section>
                </div>
            </div>
        </OpsLayout>
    );
}

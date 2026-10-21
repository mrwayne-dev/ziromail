import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import useOpsLoading from '../../Hooks/useOpsLoading';
import DataTable from '../../Components/ops/DataTable';
import SectionHeader from '../../Components/ops/SectionHeader';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import Select from '../../Components/ui/Select';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDay, formatTime } from '../../Lib/format';
import { route } from '../../Lib/route';

const KINDS = [['all', 'Everything'], ['sign-in', 'Sign-ins and passwords'], ['account', 'Customer account changes'], ['access', 'Access changes'], ['staff', 'Staff actions']];
const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

export default function Audit() {
    const { filters, people, entries, nextBefore } = usePage().props;
    const [form, setForm] = useState(filters);
    const loading = useOpsLoading();
    const query = (extra = {}) => ({ q: form.q || undefined, who: form.who === 'any' ? undefined : form.who, kind: form.kind === 'all' ? undefined : form.kind, ...extra });
    const go = (params) => router.get(route('ops.audit'), params, { preserveState: true, preserveScroll: true });

    const rows = useMemo(() => entries, [entries]);
    const sections = (row, previous) => {
        const day = dayKey(row.at);
        if (previous && dayKey(previous.at) === day) return null;
        return formatDay(row.at);
    };

    return (
        <OpsLayout page="ops-audit" title="Audit trail">
            <SectionHeader
                title="Audit trail"
                description="Every recorded action: sign-ins, account changes and staff actions. Append-only: nothing here can be edited or deleted by anybody, including an owner."
                actions={<Button size="sm" variant="line" onClick={() => go(query())}>Apply filter</Button>}
            />

            <DataTable
                loading={loading}
                toolbar={{
                    caption: 'Audit trail',
                    search: { value: form.q ?? '', onChange: (value) => setForm({ ...form, q: value }), placeholder: 'An action or a word from it' },
                    right: (
                        <>
                            <Select value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} aria-label="Person" className="ops-toolbar-sel">
                                <option value="any">Anybody</option>
                                <option value="system">System</option>
                                {people.map((person) => <option key={person.value} value={person.value}>{person.label}</option>)}
                            </Select>
                            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} aria-label="Kind" className="ops-toolbar-sel">
                                {KINDS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </Select>
                        </>
                    ),
                }}
                columns={[
                    { id: 'at', header: 'Time', accessor: (row) => formatTime(row.at), mono: true, nowrap: true, align: 'num', width: 92 },
                    { id: 'actor', header: 'Who', accessor: (row) => row.actor, nowrap: true, width: 160 },
                    { id: 'text', header: 'What', accessor: (row) => (
                        <span>
                            <b>{row.text}</b>{row.detail ? <span className="ops-mut">: {row.detail}</span> : null}
                            {row.reason && <span className="ops-row-detail-italic">{row.reason}</span>}
                        </span>
                    ) },
                ]}
                rows={rows}
                rowKey={(row) => row.id}
                sections={sections}
                emptyState={{ title: 'Nothing matches', body: 'Try different filters or a wider search.' }}
            />

            {nextBefore && (
                <div className="ops-centered mt-14">
                    <Button variant="line" size="sm" onClick={() => go(query({ before: nextBefore }))}>Load older entries</Button>
                </div>
            )}

            <Note title="What is and is not recorded" className="mt">
                <p>We record that something happened, who did it, when and from where. We never record passwords, codes or the contents of anybody's mail.</p>
            </Note>
        </OpsLayout>
    );
}

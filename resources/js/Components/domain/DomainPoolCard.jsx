import { plans } from '../../fixtures/plans';
import PoolBar from './PoolBar';

const business = plans.find((plan) => plan.code === 'business');

// An illustrative domain: one plan's pool split between four mailboxes. The
// figures add up to the plan's pool (12 + 8 + 4 + 2 + 4 free).
const mailboxes = [
    { name: 'victory@', assigned: 12, used: '4.2', tone: 's1' },
    { name: 'sales@', assigned: 8, used: '6.1', tone: 's2' },
    { name: 'ngozi@', assigned: 4, used: '1.8', tone: 's3' },
    { name: 'emeka@', assigned: 2, used: '1.4', tone: 's4' },
];
const unassigned = business.poolGb - mailboxes.reduce((sum, m) => sum + m.assigned, 0);

export default function DomainPoolCard() {
    const description = `${business.poolGb} GB pool split: ${mailboxes
        .map((m) => `${m.name.replace('@', '')} ${m.assigned} GB`)
        .join(', ')}, ${unassigned} GB unassigned`;

    return (
        <div className="domain-card">
            <p className="dom">
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" stroke="#1066C6" strokeWidth="1.5" />
                    <path d="M1.5 8h13M8 1.5c1.8 2 2.6 4.2 2.6 6.5S9.8 12.5 8 14.5c-1.8-2-2.6-4.2-2.6-6.5S6.2 3.5 8 1.5z" stroke="#1066C6" strokeWidth="1.3" />
                </svg>
                {' '}
                adaobifoods.com
                {' '}
                <span className="pill pill-info">{business.name} · {business.poolGb} GB</span>
            </p>

            <div className="mt">
                <PoolBar
                    description={description}
                    freeGb={unassigned}
                    segments={mailboxes.map((m, i) => ({
                        key: m.name,
                        gb: m.assigned,
                        label: i === mailboxes.length - 1 ? m.assigned : undefined,
                    }))}
                />
            </div>

            <div className="tbl-wrap" style={{ marginTop: 20, borderRadius: 'var(--r-xs)' }}>
                <table className="data" style={{ minWidth: 0 }}>
                    <caption className="sr-only">Storage assigned to each mailbox on adaobifoods.com</caption>
                    <thead>
                        <tr>
                            <th scope="col">Mailbox</th>
                            <th scope="col" className="c">Assigned</th>
                            <th scope="col" className="c">Used</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mailboxes.map((m) => (
                            <tr key={m.name}>
                                <th scope="row" className="mono">{m.name}</th>
                                <td className="c num">{m.assigned} GB</td>
                                <td className="c num">{m.used} GB</td>
                            </tr>
                        ))}
                        <tr>
                            <th scope="row" style={{ color: 'var(--tx-2)' }}>Unassigned</th>
                            <td className="c num" style={{ color: 'var(--tx-2)' }}>{unassigned} GB</td>
                            <td className="c" style={{ color: 'var(--tx-2)' }}>n/a</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

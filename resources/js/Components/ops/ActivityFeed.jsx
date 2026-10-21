import { Activity, AlertTriangle, FileSignature, Globe, Inbox, KeyRound, LogIn, Receipt, Shield, UserPlus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { formatRelative } from '../../Lib/format';

/*
 * Vertical feed of audit events, used inside ops cards (Overview, User page, Abuse detail).
 * Rows: icon tile → bold title with emphasised fragment → relative time. First-mount items
 * stagger in (≤30ms per row, capped at 400ms); `prefers-reduced-motion` disables it.
 *
 * References:
 *   https://21st.dev/@olewandowski1/components/activity-3
 *   https://21st.dev/@felipemenezes098/components/item-19
 */

const CATEGORY_ICON = {
    security: Shield,
    domain: Globe,
    mailboxes: Inbox,
    billing: Receipt,
    access: KeyRound,
    auth: LogIn,
    staff: UserPlus,
    abuse: AlertTriangle,
    audit: FileSignature,
};

function Emphasised({ text, emphasis }) {
    if (!emphasis) return text;
    const at = text.indexOf(emphasis);
    if (at < 0) return text;
    return (
        <>
            {text.slice(0, at)}
            <b>{emphasis}</b>
            {text.slice(at + emphasis.length)}
        </>
    );
}

function Row({ item, delay, animate }) {
    const Icon = CATEGORY_ICON[item.category] ?? Activity;
    const inner = (
        <>
            <span className="ops-row-ic" aria-hidden="true"><Icon size={16} strokeWidth={1.6} /></span>
            <span className="ops-row-body">
                <span className="ops-row-title"><Emphasised text={item.text} emphasis={item.emphasis} /></span>
                {item.detail && <span className="ops-row-detail">{item.detail}</span>}
            </span>
            <span className="ops-row-time">{formatRelative(item.at)}</span>
        </>
    );
    const Component = animate ? motion.div : 'div';
    const motionProps = animate ? {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, delay, ease: [0.22, 0.9, 0.2, 1] },
    } : {};

    return <Component className="ops-row" {...motionProps}>{inner}</Component>;
}

export default function ActivityFeed({ items, emptyLabel = 'Nothing to show' }) {
    const reduce = useReducedMotion();
    if (!items?.length) return <p className="ops-sm ops-mut" style={{ margin: '12px 0 0' }}>{emptyLabel}</p>;

    return (
        <div className="ops-rows" role="list" aria-label="Recent activity">
            {items.map((item, index) => (
                <Row
                    key={item.id}
                    item={item}
                    delay={Math.min(index * 0.03, 0.4)}
                    animate={!reduce}
                />
            ))}
        </div>
    );
}

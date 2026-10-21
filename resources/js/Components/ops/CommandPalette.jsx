import { router } from '@inertiajs/react';
import { Command } from 'cmdk';
import { AlertTriangle, Archive, BarChart3, BookOpen, Globe, IdCard, Inbox, LayoutDashboard, LineChart, Receipt, Scroll, Shield, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { route } from '../../Lib/route';

/*
 * The ops command palette. ⌘K / Ctrl+K opens it anywhere inside `.ops`. Each entry is a
 * destination with a short label and an icon; the palette fuzzy-filters as the user types.
 *
 * We ship navigation entries today (every ops route). Entity search (users, domains,
 * mailboxes, abuse flags) will plug into the same list once we have the lookup endpoints.
 *
 * Reference:
 *   https://21st.dev/@ephraimduncan/components/command-menu-04
 *   https://21st.dev/@uvain/components/command-menu-palette
 */

const NAV = [
    { group: 'Watch', items: [
        { label: 'Overview', hint: 'Platform figures and attention stack', route: 'ops', icon: LayoutDashboard, keywords: 'home platform figures' },
        { label: 'Deliverability', hint: 'Bounce rate, complaints, delivery health', route: 'ops.deliverability', icon: LineChart, keywords: 'bounce delivery deliverability' },
        { label: 'Delivery log', hint: 'Per hour outcomes by provider', route: 'ops.queue', icon: Scroll, keywords: 'queue log delivery messages' },
        { label: 'Domain status', hint: 'Every domain and who owns it', route: 'ops.domains', icon: Globe, keywords: 'domains dns mx spf dkim' },
    ]},
    { group: 'Act', items: [
        { label: 'Abuse queue', hint: 'Flagged mailboxes waiting for a decision', route: 'ops.abuse', icon: AlertTriangle, keywords: 'abuse flag spam lock' },
        { label: 'Spam rules', hint: 'What the sending bot does and does not', route: 'ops.spam-rules', icon: Shield, keywords: 'spam rules bot thresholds' },
        { label: 'Refunds', hint: 'Money going back out', route: 'ops.refunds', icon: Receipt, keywords: 'refunds money billing' },
    ]},
    { group: 'Accounts', items: [
        { label: 'Users', hint: 'Every customer account', route: 'ops.users', icon: Users, keywords: 'users customers accounts search' },
        { label: 'Mailboxes', hint: 'Every mailbox on the platform', route: 'ops.mailboxes', icon: Inbox, keywords: 'mailboxes inbox addresses' },
    ]},
    { group: 'Platform', items: [
        { label: 'Backups', hint: 'Nightly snapshots and restores', route: 'ops.backups', icon: Archive, keywords: 'backups snapshots restore' },
        { label: 'Reports', hint: 'Month by month figures', route: 'ops.reports', icon: BarChart3, keywords: 'reports monthly growth billing' },
        { label: 'Staff', hint: 'Who works here and what they can do', route: 'ops.staff', icon: IdCard, keywords: 'staff people roles permissions' },
        { label: 'Audit trail', hint: 'Every recorded action', route: 'ops.audit', icon: BookOpen, keywords: 'audit history trail log' },
    ]},
];

export function useCommandPalette() {
    const [open, setOpen] = useState(false);
    const toggle = useCallback(() => setOpen((state) => !state), []);
    useEffect(() => {
        const onKey = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                toggle();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [toggle]);

    return { open, setOpen, toggle };
}

export default function CommandPalette({ open, onClose }) {
    const reduce = useReducedMotion();
    const [query, setQuery] = useState('');
    useEffect(() => { if (!open) setQuery(''); }, [open]);

    const go = (routeName) => {
        onClose();
        router.visit(route(routeName));
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="ops-cmdk"
                    role="dialog" aria-modal="true" aria-label="Command palette"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.14 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="ops-cmdk-box"
                        onClick={(event) => event.stopPropagation()}
                        initial={reduce ? false : { y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { y: -6, opacity: 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.22, 0.9, 0.2, 1] }}
                    >
                        <Command label="Ops command menu">
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Jump to a page, action or account"
                                autoFocus
                            />
                            <Command.List>
                                <Command.Empty>No matches.</Command.Empty>
                                {NAV.map((group) => (
                                    <Command.Group key={group.group} heading={group.group}>
                                        {group.items.map((item) => (
                                            <Command.Item
                                                key={item.route}
                                                value={`${item.label} ${item.keywords}`}
                                                onSelect={() => go(item.route)}
                                            >
                                                <span className="ic" aria-hidden="true"><item.icon size={16} strokeWidth={1.75} /></span>
                                                <span className="meta">
                                                    <span className="lbl">{item.label}</span>
                                                    <span className="hint">{item.hint}</span>
                                                </span>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ))}
                            </Command.List>
                            <div className="ops-cmdk-foot" aria-hidden="true">
                                <span>↑↓ to move</span>
                                <span>Enter to open</span>
                                <span>Esc to close</span>
                            </div>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

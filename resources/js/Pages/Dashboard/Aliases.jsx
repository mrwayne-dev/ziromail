import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AddressDialog from '../../Components/dashboard/AddressDialog';
import Button from '../../Components/ui/Button';
import DataTable from '../../Components/ui/DataTable';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import SectionHeader from '../../Components/ui/SectionHeader';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

const short = (address) => `${address.split('@')[0]}@`;

export default function Aliases() {
    const { domain, aliases, mailboxes } = usePage().props;
    const { toast } = useToast();
    const [editing, setEditing] = useState(null);
    const dialog = useDisclosure();
    const openFor = (alias) => { setEditing(alias); dialog.open(); };

    function remove(alias) {
        router.delete(route('dashboard.aliases.destroy', { alias: alias.id }), {
            preserveScroll: true,
            onSuccess: () => toast({ tone: 'ok', title: 'Address removed', message: alias.address }),
        });
    }

    const noMailboxes = mailboxes.length === 0;

    return (
        <DashboardLayout page="admin-aliases" title="Extra addresses" description="Addresses that deliver into an existing mailbox.">
            <SectionHeader
                title="Extra addresses"
                description={<>Addresses on <span className="mono">{domain.name}</span> that deliver into an existing mailbox. They use no storage of their own and are not charged.</>}
                actions={<Button variant="ink" size="sm" onClick={() => openFor(null)} disabled={noMailboxes} title={noMailboxes ? 'Add a mailbox before you can add an alias' : undefined}>Add an address</Button>}
            />

            <DataTable
                columns={[
                    { id: 'address', header: 'Address', mono: true, sortable: true, sortValue: (row) => row.address, accessor: (row) => row.address },
                    { id: 'to', header: 'Delivers to', accessor: (row) => <span className="mono">{row.destinations.map(short).join(' and ')}</span> },
                    { id: 'type', header: 'Type', accessor: (row) => row.type === 'forward' ? <Pill tone="info">Forwards to {row.destinations.length}</Pill> : <Pill tone="muted">Alias</Pill> },
                ]}
                rows={aliases}
                rowKey={(row) => row.id}
                renderActions={(row) => (
                    <>
                        <Button variant="line" size="sm" aria-label={`Edit ${row.address}`} onClick={() => openFor(row)}>Edit</Button>
                        {' '}
                        <Button variant="quiet" size="sm" aria-label={`Remove ${row.address}`} onClick={() => remove(row)}>Remove</Button>
                    </>
                )}
                emptyState={{
                    title: 'No extra addresses yet',
                    body: 'Add info@ or orders@ and choose which mailbox receives it.',
                    action: <Button variant="ink" size="sm" onClick={() => openFor(null)} disabled={noMailboxes}>Add an address</Button>,
                }}
            />

            <div className="grid g2 mt-l">
                <Note title="Alias or forwarding?">
                    <p>An <b>alias</b> is another name for one mailbox: replies come from the main address. <b>Forwarding</b> copies mail to several mailboxes, which suits a shared address like <span className="mono">info@</span>.</p>
                </Note>
                <Note tone="warn" title="Catch-all is off">
                    <p>A catch-all accepts mail to any address at your domain, including ones that do not exist. It attracts a great deal of spam, so we leave it off. If you genuinely need one, contact support.</p>
                </Note>
            </div>

            <AddressDialog key={editing?.id ?? 'new'} open={dialog.isOpen} onClose={dialog.close} domain={domain} mailboxes={mailboxes} editing={editing} />
        </DashboardLayout>
    );
}

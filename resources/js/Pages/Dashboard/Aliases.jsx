import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AddressDialog from '../../Components/dashboard/AddressDialog';
import Button from '../../Components/ui/Button';
import Empty from '../../Components/ui/Empty';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import Table from '../../Components/ui/Table';
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

    return (
        <DashboardLayout page="admin-aliases" title="Extra addresses" description="Addresses that deliver into an existing mailbox.">
            <div className="page-head">
                <div>
                    <h1>Extra addresses</h1>
                    <p>Addresses on <span className="mono">{domain.name}</span> that deliver into an existing mailbox. They use no storage of their own and are not charged.</p>
                </div>
                <Button onClick={() => openFor(null)} disabled={mailboxes.length === 0}>Add an address</Button>
            </div>

            {aliases.length === 0 ? (
                <Empty icon="@" title="No extra addresses yet" action={<Button onClick={() => openFor(null)} disabled={mailboxes.length === 0}>Add an address</Button>}>
                    Add info@ or orders@ and choose which mailbox receives it.
                </Empty>
            ) : (
                <Table
                    caption="Extra addresses and where each delivers"
                    head={<tr><th scope="col">Address</th><th scope="col">Delivers to</th><th scope="col">Type</th><th scope="col"><span className="sr-only">Actions</span></th></tr>}
                >
                    {aliases.map((alias) => (
                        <tr key={alias.id}>
                            <td className="al-addr">{alias.address}</td>
                            <td><span className="al-to">{alias.destinations.map(short).join(' and ')}</span></td>
                            <td>{alias.type === 'forward' ? <Pill tone="info">Forwards to {alias.destinations.length}</Pill> : <Pill tone="muted">Alias</Pill>}</td>
                            <td className="cell-end">
                                <span className="act-btns">
                                    <Button variant="line" size="sm" aria-label={`Edit ${alias.address}`} onClick={() => openFor(alias)}>Edit</Button>
                                    <Button variant="quiet" size="sm" aria-label={`Remove ${alias.address}`} onClick={() => remove(alias)}>Remove</Button>
                                </span>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}

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

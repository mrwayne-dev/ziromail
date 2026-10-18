import { useState } from 'react';
import AddressDialog from '../../Components/dashboard/AddressDialog';
import Button from '../../Components/ui/Button';
import Empty from '../../Components/ui/Empty';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import Table from '../../Components/ui/Table';
import { useToast } from '../../Components/ui/Toast';
import useCurrentDomain from '../../Hooks/useCurrentDomain';
import useDisclosure from '../../Hooks/useDisclosure';
import useScenario from '../../Hooks/useScenario';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { aliasesProps } from '../../fixtures/dashboard';

const short = (address) => `${address.split('@')[0]}@`;

export default function Aliases() {
    const { current } = useCurrentDomain();
    const scenario = useScenario();
    const props = aliasesProps(current.id, scenario);
    const { domain, mailboxes } = props;
    const { toast } = useToast();
    const [list, setList] = useState(props.aliases);
    const [catchAll, setCatchAll] = useState(props.catchAll.on);
    const [editing, setEditing] = useState(null);
    const dialog = useDisclosure();
    const confirmCatchAll = useDisclosure();

    const save = (alias) => setList((items) => (items.some((item) => item.id === alias.id) ? items.map((item) => (item.id === alias.id ? alias : item)) : [...items, alias]));
    const openFor = (alias) => { setEditing(alias); dialog.open(); };

    return (
        <DashboardLayout page="admin-aliases" title="Extra addresses" description="Addresses that deliver into an existing mailbox.">
            <div className="page-head">
                <div>
                    <h1>Extra addresses</h1>
                    <p>Addresses on <span className="mono">{domain.name}</span> that deliver into an existing mailbox. They use no storage of their own and are not charged.</p>
                </div>
                <Button onClick={() => openFor(null)} disabled={mailboxes.length === 0}>Add an address</Button>
            </div>

            {list.length === 0 ? (
                <Empty icon="@" title="No extra addresses yet" action={<Button onClick={() => openFor(null)} disabled={mailboxes.length === 0}>Add an address</Button>}>
                    Add info@ or orders@ and choose which mailbox receives it.
                </Empty>
            ) : (
                <Table
                    caption="Extra addresses and where each delivers"
                    head={<tr><th scope="col">Address</th><th scope="col">Delivers to</th><th scope="col">Type</th><th scope="col"><span className="sr-only">Actions</span></th></tr>}
                >
                    {list.map((alias) => (
                        <tr key={alias.id}>
                            <td className="al-addr">{alias.address}</td>
                            <td><span className="al-to">{alias.destinations.map(short).join(' and ')}</span></td>
                            <td>{alias.type === 'forward' ? <Pill tone="info">Forwards to {alias.destinations.length}</Pill> : <Pill tone="muted">Alias</Pill>}</td>
                            <td className="cell-end"><Button variant="line" size="sm" aria-label={`Edit ${alias.address}`} onClick={() => openFor(alias)}>Edit</Button></td>
                        </tr>
                    ))}
                </Table>
            )}

            <div className="grid g2 mt-l">
                <Note title="Alias or forwarding?">
                    <p>An <b>alias</b> is another name for one mailbox: replies come from the main address. <b>Forwarding</b> copies mail to several mailboxes, which suits a shared address like <span className="mono">info@</span>.</p>
                </Note>
                <Note tone="warn" title={catchAll ? 'Catch-all is on' : 'Catch-all is off'}>
                    <p>
                        A catch-all accepts mail to any address at your domain, including ones that do not exist. It attracts a great deal of spam, so we leave it off.
                        {catchAll ? ' Turn it off again if the spam is more than you need.' : ' Turn it on only if you genuinely need it.'}
                    </p>
                    <Button variant="line" size="sm" className="mt-s" onClick={catchAll ? () => setCatchAll(false) : confirmCatchAll.open}>{catchAll ? 'Turn off catch-all' : 'Turn on catch-all'}</Button>
                </Note>
            </div>

            <AddressDialog
                key={editing?.id ?? 'new'}
                open={dialog.isOpen}
                onClose={dialog.close}
                domainName={domain.name}
                mailboxes={mailboxes}
                existing={list}
                editing={editing}
                onSave={save}
            />

            <Modal
                open={confirmCatchAll.isOpen}
                onClose={confirmCatchAll.close}
                title="Turn on catch-all?"
                size="sm"
                footer={(
                    <>
                        <Button variant="quiet" onClick={confirmCatchAll.close}>Cancel</Button>
                        <Button variant="ink" onClick={() => { setCatchAll(true); confirmCatchAll.close(); toast({ tone: 'warn', title: 'Catch-all is on', message: 'Expect more spam in the receiving mailbox.' }); }}>Turn on</Button>
                    </>
                )}
            >
                <p>Mail to any address at {domain.name}, including addresses that do not exist, will be delivered. Expect much more spam.</p>
            </Modal>
        </DashboardLayout>
    );
}

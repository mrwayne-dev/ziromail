import { useState } from 'react';
import AddAdminPanel from '../../Components/dashboard/AddAdminPanel';
import ExportCard from '../../Components/dashboard/ExportCard';
import TeamList from '../../Components/dashboard/TeamList';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import Table from '../../Components/ui/Table';
import { useToast } from '../../Components/ui/Toast';
import useConfirmPassword from '../../Hooks/useConfirmPassword';
import useDisclosure from '../../Hooks/useDisclosure';
import useScenario from '../../Hooks/useScenario';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { teamProps } from '../../fixtures/dashboard';
import { webEndpoints } from '../../Lib/identityEndpoints';
import { ROLE_MATRIX } from '../../Lib/permissions';

export default function Team() {
    const scenario = useScenario();
    const props = teamProps(scenario);
    const { toast } = useToast();
    const [adding, setAdding] = useState(false);
    const [people, setPeople] = useState(props.people);
    const [delegations, setDelegations] = useState(props.delegations);
    const [withdrawing, setWithdrawing] = useState(null);
    const withdraw = useDisclosure();
    const { confirm, dialog } = useConfirmPassword(webEndpoints().confirmPassword);

    function askWithdraw(delegation) {
        setWithdrawing(delegation);
        withdraw.open();
    }

    function doWithdraw() {
        withdraw.close();
        confirm(async () => {
            setDelegations((list) => list.map((item) => (item.id === withdrawing.id ? { ...item, revokedAt: '2026-09-29' } : item)));
            toast({ tone: 'ok', title: 'Access withdrawn', message: `${withdrawing.granteeName} can no longer sign in to your account.` });
        });
    }

    return (
        <DashboardLayout page="admin-team" title="Team & access" description="Who can administer your domains, and what each of them can do.">
            <div className="page-head">
                <div>
                    <h1>Team &amp; access</h1>
                    <p>Who can administer <span className="mono">{props.domain.name}</span>, and what each of them can do.</p>
                </div>
                {props.canManageAccess && <Button onClick={() => setAdding(true)}>Add an administrator</Button>}
            </div>

            <Card as="section" aria-labelledby="people-h">
                <h2 className="heading-sm" id="people-h">People with access</h2>
                <TeamList
                    people={people}
                    delegations={delegations}
                    onChange={props.canManageAccess ? () => setAdding(true) : undefined}
                    onWithdraw={props.canManageAccess ? askWithdraw : undefined}
                />
            </Card>

            {adding && (
                <AddAdminPanel
                    onCancel={() => setAdding(false)}
                    onAdded={(email) => setPeople((list) => [...list, { id: `p_${email}`, name: email.split('@')[0], email, role: 'admin', locked: false, kind: 'person', grantedAt: '2026-09-29' }])}
                />
            )}

            <h2 className="heading-sm spaced">What each role can do</h2>
            <Table
                caption="Permissions by role"
                className="mt"
                head={<tr><th scope="col">Can</th><th scope="col" className="cell-mid">Owner</th><th scope="col" className="cell-mid">Administrator</th><th scope="col" className="cell-mid">User</th></tr>}
            >
                {ROLE_MATRIX.map((row) => (
                    <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {['owner', 'admin', 'user'].map((role) => (
                            <td key={role} className={row[role] ? 'y' : 'n'}>
                                {row[role] ? <><span aria-hidden="true">{'✓'}</span><span className="sr-only">Yes</span></> : <><span aria-hidden="true">{'–'}</span><span className="sr-only">No</span></>}
                            </td>
                        ))}
                    </tr>
                ))}
            </Table>

            <Note title="Why delegated access can always be withdrawn" className="mt-l">
                <p>
                    Most businesses arrive through the agency that built their website, and that relationship sometimes ends badly. Delegated access gives an agency everything it needs to do the work, and gives you the one thing that matters: the ability to take the keys back yourself, without asking anyone.
                </p>
            </Note>

            <div className="mt-l">
                <p className="sm mut">This is the account you are signed in with. These settings are live.</p>
                <div className="mt"><SecurityPanel /></div>
            </div>

            {props.canExport && <ExportCard />}

            <Modal
                open={withdraw.isOpen}
                onClose={withdraw.close}
                title={`Withdraw access from ${withdrawing?.granteeName ?? ''}?`}
                size="sm"
                footer={(
                    <>
                        <Button variant="quiet" onClick={withdraw.close}>Cancel</Button>
                        <Button variant="danger" onClick={doWithdraw}>Withdraw access</Button>
                    </>
                )}
            >
                <p>They are signed out at once and cannot sign back in. You can grant access again later. We will ask for your password to confirm.</p>
            </Modal>
            {dialog}
        </DashboardLayout>
    );
}

import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AddAdminPanel from '../../Components/dashboard/AddAdminPanel';
import ExportCard from '../../Components/dashboard/ExportCard';
import TeamList from '../../Components/dashboard/TeamList';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Button from '../../Components/ui/Button';
import DataTable from '../../Components/ui/DataTable';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import { useToast } from '../../Components/ui/Toast';
import useConfirmPassword from '../../Hooks/useConfirmPassword';
import useDisclosure from '../../Hooks/useDisclosure';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { webEndpoints } from '../../Lib/identityEndpoints';
import { route } from '../../Lib/route';
import { ROLE_MATRIX } from '../../Lib/permissions';

const ROLES = ['owner', 'admin', 'user'];
const ROLE_HEAD = { owner: 'Owner', admin: 'Administrator', user: 'User' };

export default function Team() {
    const { domain, people, delegations, canManageAccess, canExport } = usePage().props;
    const { toast } = useToast();
    const [adding, setAdding] = useState(false);
    const [withdrawing, setWithdrawing] = useState(null);
    const withdraw = useDisclosure();
    const { confirm, dialog } = useConfirmPassword(webEndpoints().confirmPassword);

    function askWithdraw(delegation) {
        setWithdrawing(delegation);
        withdraw.open();
    }

    function doWithdraw() {
        withdraw.close();
        confirm(() => router.delete(route('dashboard.team.withdraw', { delegation: withdrawing.id }), {
            preserveScroll: true,
            onSuccess: () => toast({ tone: 'ok', title: 'Access withdrawn', message: `${withdrawing.granteeName} can no longer sign in to your account.` }),
        }));
    }

    function removeMember(person) {
        confirm(() => router.delete(route('dashboard.team.remove', { member: person.id }), {
            preserveScroll: true,
            onSuccess: () => toast({ tone: 'ok', title: 'Administrator removed', message: person.email }),
        }));
    }

    const matrixColumns = [
        { id: 'can', header: 'Can', accessor: (row) => row.label },
        ...ROLES.map((role) => ({
            id: role,
            header: ROLE_HEAD[role],
            align: 'num',
            accessor: (row) => row[role]
                ? <span className="pill pill-ok" aria-label="Yes">Yes</span>
                : <span className="pill pill-mut" aria-label="No">No</span>,
        })),
    ];

    return (
        <DashboardLayout page="admin-team" title="Team & access" description="Who can administer your domains, and what each of them can do.">
            <SectionHeader
                title="Team & access"
                description={<>Who can administer <span className="mono">{domain?.name ?? 'your domain'}</span>, and what each of them can do.</>}
                actions={canManageAccess ? <Button variant="ink" size="sm" onClick={() => setAdding(true)}>Add an administrator</Button> : null}
            />

            <SubSection id="people-h" title="People with access">
                <TeamList
                    people={people}
                    delegations={delegations}
                    onChange={canManageAccess ? removeMember : undefined}
                    onWithdraw={canManageAccess ? askWithdraw : undefined}
                />
            </SubSection>

            {adding && <AddAdminPanel onCancel={() => setAdding(false)} />}

            <SubSection id="roles-h" title="What each role can do">
                <DataTable
                    columns={matrixColumns}
                    rows={ROLE_MATRIX}
                    rowKey={(row) => row.label}
                    emptyState={{ title: 'No roles yet' }}
                />
            </SubSection>

            <Note title="Why delegated access can always be withdrawn" className="mt-l">
                <p>
                    Most businesses arrive through the agency that built their website, and that relationship sometimes ends badly. Delegated access gives an agency everything it needs to do the work, and gives you the one thing that matters: the ability to take the keys back yourself, without asking anyone.
                </p>
            </Note>

            <SubSection id="sec-h" title="Your security" description="This is the account you are signed in with. These settings are live.">
                <SecurityPanel />
            </SubSection>

            {canExport && <ExportCard />}

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

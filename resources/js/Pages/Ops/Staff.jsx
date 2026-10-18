import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import StaffList from '../../Components/ops/StaffList';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Field, { Input } from '../../Components/ui/Field';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import Select from '../../Components/ui/Select';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { staffRoles, staffRoster } from '../../fixtures/ops';
import { staffEndpoints } from '../../Lib/identityEndpoints';
import { route } from '../../Lib/route';
import { Link } from '@inertiajs/react';

export default function Staff() {
    const { staff } = usePage().props;
    const { toast } = useToast();
    const can = useOpsCan();
    const invite = useDisclosure();
    const [people, setPeople] = useState(staffRoster);
    const [form, setForm] = useState({ name: '', email: '', role: 'support' });
    const [error, setError] = useState('');
    const owners = people.filter((person) => person.role === 'owner').length;

    function send(event) {
        event.preventDefault();
        if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return setError('Enter a name and a full email address.');
        setPeople((list) => [...list, { id: `staff_${form.email}`, name: form.name.trim(), email: form.email.trim(), role: form.role, perms: ['Read accounts'], strong: null, lastSignInAt: null, place: null, method: null, invited: true, invitedAt: '2026-09-29' }]);
        toast({ tone: 'ok', title: 'Invitation recorded', message: 'Preview: no email is sent. Real staff accounts are created with the staff:create command.' });
        setError('');
        setForm({ name: '', email: '', role: 'support' });
        invite.close();
    }

    return (
        <OpsLayout page="ops-staff" title="Staff">
            <div className="ops-head">
                <div>
                    <h1>Staff and permissions</h1>
                    <p>Who works here and what each person can do. Anything that touches customer mail needs owner-level access and is always recorded.</p>
                </div>
                {can('staff.manage') && <Button size="sm" onClick={invite.open}>Invite somebody</Button>}
            </div>

            <div className="mb">
                <p className="sm mut">You are signed in as <b>{staff?.name}</b> ({staff?.role}). These settings are live. Two-factor cannot be turned off for a staff account.</p>
                <div className="mt"><SecurityPanel endpoints={staffEndpoints()} account={staff} mandatoryTwoFactor /></div>
            </div>

            <section aria-labelledby="pp-h" className="mt-l">
                <h2 id="pp-h">People</h2>
                <p className="sm mut mt-s">{people.length} accounts in the demonstration roster. Every sign-in requires two-factor authentication.</p>
                <StaffList people={people} viewerEmail={staff?.email} canManage={can('staff.manage')} onChange={(person) => toast({ tone: 'warn', title: `Change access for ${person.name}`, message: owners <= 2 && person.role === 'owner' ? 'Two owners are the minimum, so an owner cannot be demoted here.' : 'Preview: roles are changed with the staff command for now.' })} onResend={(person) => toast({ tone: 'ok', title: 'Invitation resent', message: person.email })} />
            </section>

            <section aria-labelledby="rl-h" className="mt-l">
                <h2 id="rl-h">What each role can do</h2>
                <div className="grid-roles mt">
                    {Object.entries(staffRoles).map(([key, role]) => (
                        <Card key={key}>
                            <h3>{role.label}</h3>
                            <p className="sm mut mt-s">{role.can}</p>
                            {role.cannot && <p className="sm mut mt-s"><b>Cannot</b> {role.cannot}</p>}
                            {key === 'owner' && <p className="sm mut mt-s">Two owners minimum, so nobody can lock themselves out and no single person can act unchecked.</p>}
                        </Card>
                    ))}
                </div>
                <Note tone="bad" title="Reading a customer's mail" className="mt">
                    <p>Only an owner can, only with the customer's written request attached, and the customer is emailed automatically when it happens. The mailbox owner sees a permanent entry in their own activity log.</p>
                    <Link className="tlink mt" href={`${route('ops.audit')}`}>See these occasions in the audit trail</Link>
                </Note>
            </section>

            <Modal open={invite.isOpen} onClose={invite.close} title="Invite somebody" size="sm" footer={<><Button variant="quiet" onClick={invite.close}>Cancel</Button><Button type="submit" form="invite-form">Send invitation</Button></>}>
                <form id="invite-form" noValidate onSubmit={send}>
                    <Field label="Name">{(props) => <Input {...props} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
                    <Field label="Work email" error={error}>{(props) => <Input {...props} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
                    <Field label="Role">{(props) => <Select {...props} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{Object.entries(staffRoles).map(([key, role]) => <option key={key} value={key}>{role.label}</option>)}</Select>}</Field>
                </form>
            </Modal>
        </OpsLayout>
    );
}

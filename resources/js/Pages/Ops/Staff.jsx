import { usePage } from '@inertiajs/react';
import SectionHeader, { SubSection } from '../../Components/ops/SectionHeader';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatRelative, initials } from '../../Lib/format';
import { staffEndpoints } from '../../Lib/identityEndpoints';

const ROLE = { owner: 'Owner', engineer: 'Engineer', support: 'Support' };
const CAN = {
    support: ['Read any account, re-check DNS records and request a refund.', 'Cannot lock an account, approve a refund or restore a backup.'],
    engineer: ['Everything Support can do, plus lock and unlock accounts and restore backups.', 'Cannot approve refunds or change staff access.'],
    owner: ['Everything, including approving refunds and changing staff access.', 'Two owners minimum, so nobody can lock themselves out and no single person can act unchecked.'],
};

export default function Staff() {
    const { staff, people, owners } = usePage().props;

    return (
        <OpsLayout page="ops-staff" title="Staff">
            <SectionHeader
                title="Staff and permissions"
                description="Who works here and what each person can do. Every action is recorded with the person's name."
            />

            <section className="ops-card">
                <h2 className="ops-card-h">Your security</h2>
                <p className="ops-card-lede">You are signed in as <b>{staff?.name}</b> ({staff?.role}). Two-factor cannot be turned off for a staff account.</p>
                <div className="mt-14">
                    <SecurityPanel endpoints={staffEndpoints()} account={staff} mandatoryTwoFactor />
                </div>
            </section>

            <SubSection id="pp-h" title="People" description={`${people.length} ${people.length === 1 ? 'account' : 'accounts'}. Every sign-in requires two-factor authentication.`}>
                <div className="ops-stack">
                    {people.map((person) => (
                        <article key={person.id} className="ops-card ops-person">
                            <span aria-hidden="true" className="ops-person-av">{initials(person.name)}</span>
                            <div>
                                <div className="ops-person-head">
                                    <b className="ops-person-name">{person.name}</b>
                                    <span className="ops-sm ops-mut">{person.email}</span>
                                </div>
                                <div className="ops-person-perms">
                                    <span className="ops-pill info">{ROLE[person.role]}</span>
                                    {person.perms.map((perm) => <span key={perm} className="ops-pill">{perm}</span>)}
                                </div>
                                <p className="ops-sm ops-mut mt-6">
                                    {person.lastSignInAt ? `Signed in ${formatRelative(person.lastSignInAt).toLowerCase()}` : 'Has not signed in yet'}
                                    {person.twoFactorEnabled ? ' · two-factor on' : ' · two-factor not set up'}
                                </p>
                            </div>
                            <div className="ops-inline-gap">
                                {person.email === staff?.email && <span className="ops-pill info">You</span>}
                                {person.disabled && <span className="ops-pill bad">Disabled</span>}
                            </div>
                        </article>
                    ))}
                </div>
                {owners < 2 && (
                    <Note tone="warn" title="Only one owner" className="mt">
                        <p>The rule is two owners minimum, so nobody can lock themselves out and no single person can act unchecked. Add a second owner.</p>
                    </Note>
                )}
            </SubSection>

            <SubSection id="rl-h" title="What each role can do">
                <div className="ops-cards-fit">
                    {Object.entries(CAN).map(([key, [can, cannot]]) => (
                        <section key={key} className="ops-card">
                            <h3 className="ops-card-h-sm">{ROLE[key]}</h3>
                            <p className="ops-sm ops-mut mt-8">{can}</p>
                            <p className="ops-sm ops-mut mt-6">{cannot}</p>
                        </section>
                    ))}
                </div>
                <Note title="Nobody on staff can open a customer's mail" className="mt">
                    <p>There is no role, permission or screen that reads a mailbox, and no message content is stored on our side. Staff see sizes, states and billing facts only.</p>
                </Note>
                <Note title="How staff accounts are made" className="mt">
                    <p>Staff accounts are created on the server with the staff command, never through a form on this site, so nobody can invite themselves in. Ask an owner to run it.</p>
                </Note>
            </SubSection>
        </OpsLayout>
    );
}

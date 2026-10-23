import { Link, usePage } from '@inertiajs/react';
import StorageAdder from '../../Components/dashboard/StorageAdder';
import Note from '../../Components/ui/Note';
import SectionHeader from '../../Components/ui/SectionHeader';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

export default function Storage() {
    const props = usePage().props;
    const withDomain = (name) => `${route(name)}?domain=${props.domain.id}`;

    return (
        <DashboardLayout page="admin-storage" title="Add storage" description="Buy extra storage for one domain's pool.">
            <p className="sm mut mb"><Link className="back-link" href={withDomain('dashboard.mailboxes')}>&larr; All mailboxes</Link></p>
            <SectionHeader
                title="Add storage"
                description="Storage is bought per domain and lands in that domain's pool straight away. You hand it out to mailboxes yourself."
            />

            <div className="st-wrap">
                <div>
                    <StorageAdder {...props} />
                    <Note title="What happens to it" className="mt-l">
                        <p>
                            Extra storage is attached to your current plan on this domain. It is added to the pool immediately and renews with the domain on the same date, whenever in the term you buy it, so storage bought a month before renewal is charged again at that renewal. Changing plan releases it, and we say so plainly before you confirm. It does not move between domains.
                        </p>
                    </Note>
                </div>

                <div>
                    <section className="ops-card">
                        <h3 className="ops-card-h-sm">Before you buy</h3>
                        <p className="ops-card-lede">Storage already in the pool but not handed out still counts as yours. Check the pool on <Link href={withDomain('dashboard.mailboxes')}>Mailboxes</Link>: you may have room to reassign rather than buy.</p>
                    </section>
                    <section className="ops-card mt">
                        <h3 className="ops-card-h-sm">Need more than the ceiling?</h3>
                        <p className="ops-card-lede">Each plan has a ceiling. Past it, move the domain to a larger plan on <Link href={withDomain('dashboard.billing')}>Plan &amp; storage</Link>, or <Link href={route('contact')}>talk to us</Link>.</p>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}

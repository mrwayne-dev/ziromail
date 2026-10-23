import { usePage } from '@inertiajs/react';
import { Mail, MessageCircle } from 'lucide-react';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

export default function Help() {
    const { support, context } = usePage().props;
    const subject = encodeURIComponent(`${context.domain ?? 'Account'}: `);

    return (
        <DashboardLayout page="admin-help" title="Talk to us" description="How to reach support, and what to send us.">
            <SectionHeader
                title="Talk to us"
                description="No ticket numbers and no queue. Message us and a person who runs this platform answers."
            />

            <section className="two" aria-label="Ways to reach us">
                {support.whatsappLink && (
                    <section className="ops-card" aria-labelledby="wa-h">
                        <span className="ops-help-ic" aria-hidden="true">
                            <MessageCircle size={22} strokeWidth={1.7} />
                        </span>
                        <h2 className="ops-card-h" id="wa-h">WhatsApp</h2>
                        <p className="ops-help-addr mono">{support.whatsapp}</p>
                        <p className="ops-card-lede">The fastest way, and the one most people use. Send a screenshot of whatever is not working. Most things are sorted in a single exchange.</p>
                        <div className="mt">
                            <Button variant="ink" href={support.whatsappLink} target="_blank" rel="noopener">
                                Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                            </Button>
                        </div>
                        <p className="hint">{support.hours} &middot; {support.firstReply}</p>
                    </section>
                )}
                <section className="ops-card" aria-labelledby="em-h">
                    <span className="ops-help-ic" aria-hidden="true">
                        <Mail size={22} strokeWidth={1.7} />
                    </span>
                    <h2 className="ops-card-h" id="em-h">Email</h2>
                    <p className="ops-help-addr mono">{support.email}</p>
                    <p className="ops-card-lede">Better when there is a lot to explain, or when you want the exchange in writing: billing questions, a migration, anything an accountant may need later.</p>
                    <div className="mt">
                        <Button variant="line" href={`mailto:${support.email}?subject=${subject}`}>Write to us</Button>
                    </div>
                    <p className="hint">We reply within one working day, usually sooner.</p>
                </section>
            </section>

            <SubSection id="send-h" title="What to send us" description="You do not need the technical term for anything. These three things let us trace almost any problem without going back and forth.">
                <section className="ops-card">
                    <ul className="ops-help-list">
                        <li><span className="n" aria-hidden="true">1</span><span><b>What happened, in your own words.</b> &ldquo;Mail to our supplier comes back&rdquo; is enough to start.</span></li>
                        <li><span className="n" aria-hidden="true">2</span><span><b>A screenshot, if you have one.</b> The part that looks like nonsense is usually the part that tells us the cause, so send it whole.</span></li>
                        <li><span className="n" aria-hidden="true">3</span><span><b>Who it affects and roughly when it started.</b> One person or everybody, since yesterday or since this morning.</span></li>
                    </ul>
                    <dl className="ops-help-ctx mt">
                        <div className="ops-kv-row"><dt>Domain</dt><dd className="right mono">{context.domain}</dd></div>
                        <div className="ops-kv-row"><dt>Plan</dt><dd className="right">{context.plan}</dd></div>
                        <div className="ops-kv-row"><dt>Account email</dt><dd className="right">{context.accountEmail}</dd></div>
                    </dl>
                    <p className="hint">We will ask otherwise.</p>
                </section>
            </SubSection>

            <SubSection id="down-h" title="If mail has stopped entirely" description="Check two things before you message us. Between them they explain most outages, and both take a few seconds.">
                <section className="ops-card">
                    <div className="btn-row no-grow">
                        <Button variant="line" size="sm" href={route('status')} target="_blank" rel="noopener">
                            System status<span className="sr-only"> (opens in a new tab)</span>
                        </Button>
                        {context.domainId && (
                            <Button variant="line" size="sm" href={`${route('dashboard.domains.show', { domain: context.domainId })}?domain=${context.domainId}`}>
                                Your DNS records
                            </Button>
                        )}
                    </div>
                    <p className="hint">If status shows a problem, we already know and are working on it. If your DNS records have broken, that page tells you exactly which one and what to put back.</p>
                </section>
            </SubSection>

            <SubSection id="ans-h" title="Answers already written" description="Most questions we get have been asked before.">
                <section className="ops-card">
                    <div className="btn-row no-grow">
                        <Button variant="line" size="sm" href={route('help')} target="_blank" rel="noopener">
                            Help centre<span className="sr-only"> (opens in a new tab)</span>
                        </Button>
                        <Button variant="line" size="sm" href={route('migrate')} target="_blank" rel="noopener">
                            Moving from another provider<span className="sr-only"> (opens in a new tab)</span>
                        </Button>
                    </div>
                </section>
            </SubSection>

            <Note title="Urgent, out of hours" className="mt-l">
                <p>If mail has stopped for everybody and it is outside working hours, message the WhatsApp number anyway. It reaches a phone rather than an inbox, and one of us picks up delivery problems whenever they appear.</p>
            </Note>
        </DashboardLayout>
    );
}

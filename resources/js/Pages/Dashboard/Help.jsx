import { usePage } from '@inertiajs/react';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Note from '../../Components/ui/Note';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { route } from '../../Lib/route';

export default function Help() {
    const { support, context } = usePage().props;
    const subject = encodeURIComponent(`${context.domain ?? 'Account'}: `);

    return (
        <DashboardLayout page="admin-help" title="Talk to us" description="How to reach support, and what to send us.">
            <div className="page-head">
                <div>
                    <h1>Talk to us</h1>
                    <p className="measure">No ticket numbers and no queue. Message us and a person who runs this platform answers.</p>
                </div>
            </div>

            <section className="routes" aria-label="Ways to reach us">
                {support.whatsappLink && (
                <div className="route wa">
                    <span className="ic" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                    </span>
                    <h2>WhatsApp</h2>
                    <span className="addr">{support.whatsapp}</span>
                    <p>The fastest way, and the one most people use. Send a screenshot of whatever is not working. Most things are sorted in a single exchange.</p>
                    <a className="btn btn-white" href={support.whatsappLink} target="_blank" rel="noopener">Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>
                    <p className="when when-inv">{support.hours} &middot; {support.firstReply}</p>
                </div>
                )}
                <div className="route">
                    <span className="ic" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="m3 6.5 9 6.5 9-6.5" stroke="currentColor" strokeWidth="1.7" /></svg>
                    </span>
                    <h2>Email</h2>
                    <span className="addr">{support.email}</span>
                    <p>Better when there is a lot to explain, or when you want the exchange in writing: billing questions, a migration, anything an accountant may need later.</p>
                    <a className="btn btn-line" href={`mailto:${support.email}?subject=${subject}`}>Write to us</a>
                    <p className="when mut">We reply within one working day, usually sooner</p>
                </div>
            </section>

            <div className="two mt-l">
                <div>
                    <Card as="section">
                        <h2 className="heading-md">What to send us</h2>
                        <p className="sm mut mt-s">You do not need the technical term for anything. These three things let us trace almost any problem without going back and forth.</p>
                        <ul className="send-list">
                            <li><span className="n" aria-hidden="true">1</span><span><b>What happened, in your own words.</b> &ldquo;Mail to our supplier comes back&rdquo; is enough to start.</span></li>
                            <li><span className="n" aria-hidden="true">2</span><span><b>A screenshot, if you have one.</b> The part that looks like nonsense is usually the part that tells us the cause, so send it whole.</span></li>
                            <li><span className="n" aria-hidden="true">3</span><span><b>Who it affects and roughly when it started.</b> One person or everybody, since yesterday or since this morning.</span></li>
                        </ul>
                        <div className="ctx">
                            <span className="k">Useful to quote. We will ask otherwise</span>
                            <ul>
                                <li><span>Domain</span><b className="mono small-mono">{context.domain}</b></li>
                                <li><span>Plan</span><b>{context.plan}</b></li>
                                <li><span>Account email</span><b>{context.accountEmail}</b></li>
                            </ul>
                        </div>
                    </Card>

                    <Card as="section" className="mt">
                        <h2 className="heading-md">If mail has stopped entirely</h2>
                        <p className="sm mut mt-s">Check two things before you message us. Between them they explain most outages, and both take a few seconds.</p>
                        <div className="btn-row no-grow mt">
                            <Button variant="line" size="sm" href={route('status')} target="_blank" rel="noopener">System status<span className="sr-only"> (opens in a new tab)</span></Button>
                            {context.domainId && <Button variant="line" size="sm" href={`${route('dashboard.domains.show', { domain: context.domainId })}?domain=${context.domainId}`}>Your DNS records</Button>}
                        </div>
                        <p className="hint">If status shows a problem, we already know and are working on it. If your DNS records have broken, that page tells you exactly which one and what to put back.</p>
                    </Card>
                </div>

                <div className="stack">
                    <Card as="section">
                        <h2 className="heading-sm">Answers already written</h2>
                        <p className="sm mut mt-s">Most questions we get have been asked before.</p>
                        <div className="stack mt-s">
                            <Button variant="line" size="sm" full href={route('help')} target="_blank" rel="noopener">Help centre<span className="sr-only"> (opens in a new tab)</span></Button>
                            <Button variant="line" size="sm" full href={route('migrate')} target="_blank" rel="noopener">Moving from another provider<span className="sr-only"> (opens in a new tab)</span></Button>
                        </div>
                    </Card>

                    <Note title="Urgent, out of hours">
                        <p>If mail has stopped for everybody and it is outside working hours, message the WhatsApp number anyway. It reaches a phone rather than an inbox, and one of us picks up delivery problems whenever they appear.</p>
                    </Note>
                </div>
            </div>
        </DashboardLayout>
    );
}

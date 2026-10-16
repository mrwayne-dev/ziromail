import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Reveal from '../../Components/craft/Reveal';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import PageHero from '../../Components/ui/PageHero';
import Seo from '../../Components/seo/Seo';
import useReducedMotion from '../../Hooks/useReducedMotion';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 9.5a7 7 0 0 1 12.2-4.7A7 7 0 0 1 9.8 16.4L4 17.5l1.1-4A6.9 6.9 0 0 1 3 9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
);
const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m3 5.5 7 5.5 7-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
);
const PulseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M2 10h4l2-5 4 10 2-5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Contact() {
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const note = useRef(null);
    const reduced = useReducedMotion();

    // Nothing is sent: there is no backend in this phase. The pause is the
    // submit button's busy state, which the real request will reuse.
    function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setTimeout(() => {
            setBusy(false);
            setSent(true);
            requestAnimationFrame(() => note.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }));
        }, reduced ? 0 : 420);
    }

    return (
        <>
            <Seo title="Contact us | Ziroemail"
                description="Message Ziroemail on WhatsApp, or send us a note. Support from the team that runs the servers."
                path="/contact"
                ogTitle="Contact Ziroemail"
                ogDescription="Message us on WhatsApp, email support, or check system status. Support from the team that runs the servers." />

            <PageHero
              eyebrow="Contact"
              title="Talk to the people who run it."
              lead="Not a ticket queue in another time zone. WhatsApp is fastest, and it is how most Nigerian businesses already prefer to work."
            />

            <section className="contact-main">
              <div className="wrap">
                <div className="contact-grid">
                  <Reveal dir="left" className="contact-ways">
                    <Card size="lg" className="way">
                      <span className="way-ic"><ChatIcon /></span>
                      <h3>WhatsApp</h3>
                      <p>The quickest way to reach us. Send a screenshot of whatever is not working and we will tell you what to change.</p>
                      <Button href="#" size="sm">Message us</Button>
                      <p className="way-when">Mon–Fri, 9am–6pm WAT</p>
                    </Card>
                    <Card size="lg" className="way">
                      <span className="way-ic"><MailIcon /></span>
                      <h3>Email</h3>
                      <p>For anything that needs a paper trail: billing questions, migration scoping, or a formal request.</p>
                      <Button variant="line" size="sm" href="mailto:support@ziroemail.com">support@ziroemail.com</Button>
                      <p className="way-when">We reply within one working day</p>
                    </Card>
                    <Card size="lg" className="way">
                      <span className="way-ic"><PulseIcon /></span>
                      <h3>Status page</h3>
                      <p>Before you message us about an outage, check here. It is hosted away from our own servers, so it loads even when we are down.</p>
                      <Button variant="line" size="sm" href={route('status')}>Check status</Button>
                      <p className="way-when">Updated automatically</p>
                    </Card>
                  </Reveal>

                  <Reveal dir="right" className="contact-form-wrap">
                    <Card size="lg" className="contact-form">
                      <span className="eyebrow">Send a note</span>
                      <h2>Tell us what you need</h2>
                      <p className="lead">If you are asking about moving an existing setup, mention how many mailboxes and roughly how much mail you keep. It saves a round trip.</p>
                      <form onSubmit={onSubmit} noValidate>
                        <div className="field">
                          <label className="label" htmlFor="name">Your name</label>
                          <input className="input" id="name" name="name" type="text" autoComplete="name" required />
                        </div>
                        <div className="field">
                          <label className="label" htmlFor="email">Email address</label>
                          <input className="input" id="email" name="email" type="email" autoComplete="email" spellCheck="false" required />
                        </div>
                        <div className="field">
                          <label className="label" htmlFor="domain">Your domain <span className="opt">(optional)</span></label>
                          <input className="input" id="domain" name="domain" type="text" placeholder="yourbusiness.com" spellCheck="false" />
                        </div>
                        <div className="field">
                          <label className="label" htmlFor="topic">What is this about?</label>
                          <select className="select" id="topic" name="topic">
                            <option>Choosing a plan</option>
                            <option>Moving from another provider</option>
                            <option>Something is not working</option>
                            <option>Billing or an invoice</option>
                            <option>Something else</option>
                          </select>
                        </div>
                        <div className="field">
                          <label className="label" htmlFor="msg">Your message</label>
                          <textarea className="textarea" id="msg" name="msg" required />
                        </div>
                        <button className="btn btn-pri btn-lg" type="submit" data-busy={busy ? '' : undefined}>Send message</button>
                        <div ref={note} className="banner banner-ok" tabIndex={-1} hidden={!sent}>
                          <span className="bd">
                            <b>This form is not connected yet</b>
                            <p>Nothing has been sent. Message us on WhatsApp or email support@ziroemail.com and we will answer there.</p>
                          </span>
                        </div>
                      </form>
                    </Card>
                  </Reveal>
                </div>
              </div>
            </section>

            <section className="sec-sm contact-more">
              <div className="wrap">
                <Reveal stagger className="more-grid">
                  <div className="more-item">
                    <h3>Zirostack Ltd</h3>
                    <p>Port Harcourt, Rivers State<br />Nigeria</p>
                    <p>Registered with the Corporate Affairs Commission. VAT charged at 7.5% on all invoices.</p>
                  </div>
                  <div className="more-item">
                    <h3>Already a customer?</h3>
                    <p>Raise it from inside your dashboard instead. We can see your domain and mailboxes there, so it is faster than starting from scratch.</p>
                    <Link className="tlink" href={route('login')}>Sign in</Link>
                  </div>
                  <div className="more-item">
                    <h3>Reporting abuse</h3>
                    <p>If you have received spam or a phishing message from a Ziroemail address, send it to <a className="mono" href="mailto:abuse@ziroemail.com">abuse@ziroemail.com</a> with full headers. We act on these quickly. It protects everyone's delivery.</p>
                  </div>
                </Reveal>
              </div>
            </section>
        </>
    );
}

Contact.layout = (page) => (
    <PublicLayout variant="float" page="contact">{page}</PublicLayout>
);

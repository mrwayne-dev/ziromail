import { useRef, useState } from 'react';
import useReducedMotion from '../../Hooks/useReducedMotion';
import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Shape from '../../Components/craft/Shape';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

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
            <Seo title="Contact us — Ziroemail"
                description="Message Ziroemail on WhatsApp, or send us a note. Support from the team that runs the servers."
                path="/contact"
                ogTitle="Contact Ziroemail"
                ogDescription="Message us on WhatsApp, email support, or check system status. Support from the team that runs the servers." />

            <section className="c-hero">
              <Shape variant="ring" className="ch1" />
              <div className="wrap" data-hero="">
                <span className="eyebrow" style={{ marginBottom: "18px", display: "block" }}>Contact</span>
                <h1>Talk to the people who run it.</h1>
                <p className="lead">
                  Not a ticket queue in another time zone. WhatsApp is fastest, and it is how most Nigerian businesses already prefer to work.
                </p>
              </div>
            </section>
            {/* ===== WAYS TO REACH US ===== */}
            <section className="sec">
              <div className="wrap">
                <Reveal stagger className="ways">
                  <div className="way">
                    <span className="ic" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <h3>WhatsApp</h3>
                    <p>
                      The quickest way to reach us. Send a screenshot of whatever is not working and we will tell you what to change.
                    </p>
                    <a className="btn btn-pri" href="#">Message us</a>
                    <p className="when">Mon–Fri, 9am–6pm WAT</p>
                  </div>
                  <div className="way">
                    <span className="ic" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                        <path d="m3 6.5 9 6.5 9-6.5" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </span>
                    <h3>Email</h3>
                    <p>
                      For anything that needs a paper trail — billing questions, migration scoping, or a formal request.
                    </p>
                    <a className="btn btn-line" href="mailto:support@ziroemail.com">support@ziroemail.com</a>
                    <p className="when">We reply within one working day</p>
                  </div>
                  <div className="way">
                    <span className="ic" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M12 7.2v5.2l3.4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3>Status page</h3>
                    <p>
                      Before you message us about an outage, check here. It is hosted away from our own servers, so it loads even when we are down.
                    </p>
                    <Link className="btn btn-line" href={route('status')}>
                      Check status
                    </Link>
                    <p className="when">Updated automatically</p>
                  </div>
                </Reveal>
              </div>
            </section>
            {/* ===== FORM ===== */}
            <section className="sec bg-soft">
              <div className="wrap">
                <div className="form-grid">
                  <div>
                    <Reveal className="sec-head" style={{ marginBottom: "28px" }}>
                      <span className="eyebrow">Send a note</span>
                      <h2>Tell us what you need</h2>
                      <p className="lead">
                        If you are asking about moving an existing setup, mention how many mailboxes and roughly how much mail you keep — it saves a round trip.
                      </p>
                    </Reveal>
                    <form onSubmit={onSubmit} noValidate>
                      <div className="field">
                        <label className="label" htmlFor="name">Your name</label>
                        {' '}
                        <input className="input" id="name" name="name" type="text" autoComplete="name" required />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="email">Email address</label>
                        {' '}
                        <input className="input" id="email" name="email" type="email" autoComplete="email" spellCheck="false" required />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="domain">
                          Your domain
                          {' '}
                          <span className="opt">— optional</span>
                        </label>
                        {' '}
                        <input className="input" id="domain" name="domain" type="text" placeholder="yourbusiness.com" spellCheck="false" />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="topic">What is this about?</label>
                        {' '}
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
                        {' '}
                        <textarea className="textarea" id="msg" name="msg" required />
                      </div>
                      <button className="btn btn-pri btn-lg mt-l" type="submit" data-busy={busy ? '' : undefined}>Send message</button>
                      <div ref={note} className="banner banner-ok mt" tabIndex={-1} hidden={!sent}>
                        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: "none", marginTop: "1px" }}>
                          <path d="M13.5 4.5 6.2 11.8 2.5 8.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {' '}
                        <span className="bd">
                          <b>This form is not connected yet</b>
                          <p>Nothing has been sent. Message us on WhatsApp or email support@ziroemail.com and we will answer there.</p>
                        </span>
                      </div>
                    </form>
                  </div>
                  <aside>
                    <div className="card">
                      <h3 style={{ fontSize: "1.05rem" }}>Zirostack Ltd</h3>
                      <p className="sm mut mt-s">
                        Port Harcourt, Rivers State
                        <br />
                        Nigeria
                      </p>
                      <p className="sm mut" style={{ marginTop: "14px" }}>Registered with the Corporate Affairs Commission. VAT charged at 7.5% on all invoices.</p>
                    </div>
                    <div className="note mt">
                      <h4>Already a customer?</h4>
                      <p>
                        Raise it from inside your dashboard instead — we can see your domain and mailboxes there, so it is faster than starting from scratch.
                      </p>
                      <Link className="tlink mt-s" href={route('login')}>
                        Sign in
                      </Link>
                    </div>
                    <div className="note note-warn mt">
                      <h4>Reporting abuse</h4>
                      <p>
                        If you have received spam or a phishing message from a Ziroemail address, send it to
                        {' '}
                        <span className="mono">abuse@ziroemail.com</span>
                        {' '}
                        with full headers. We act on these quickly — it protects everyone's delivery.
                      </p>
                    </div>
                  </aside>
                </div>
              </div>
            </section>
        </>
    );
}

Contact.layout = (page) => (
    <PublicLayout page="contact">{page}</PublicLayout>
);

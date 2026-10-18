# Ziroemail: questions for the CEO

Prepared 16 October 2026. The public website and the 15 sign-up, checkout and setup screens are built and shown on the team preview. Everything behind them (accounts, payments, the mail servers) is not built yet. The 24 numbered questions below are the ones the build team cannot answer for you. Each is asked directly, followed by the background, why timing matters, the options, and, only where a project document already states one, the developers' recommendation. A recommendation is a starting point, not a default answer.

Already settled, so not asked here: we run our own mail server, all outgoing mail goes through Amazon, no phone apps at launch, no bulk email, no free tier, and no partner or hosting-company tools in Phase 1.

---

## 1. Pricing and billing

**Q1. Do we charge per business domain, or per person?**
*Background:* The scope document prices per person (Starter ₦1,500, Business ₦2,500, Premium ₦4,500 per person per month, with 5, 10 and 30 GB each). The website and design notes price per business: one price covers one domain and a shared storage pool the owner divides between staff (Starter ₦1,100, Business ₦2,500, Premium ₦5,000 per month, with 10, 30 and 100 GB). The website currently shows the per-business model.
*Why it matters:* Checkout, invoices, the owner dashboard and the database all follow this choice. It is cheap to change now and expensive once real customers are billed.
*Options:* (a) per business, shared storage; (b) per person, fixed storage each.
*Dev recommendation:* per business. It is newer, and the design notes say the site must never contradict it. The scope document would need amending.

**Q2. What should extra storage cost?**
*Background:* The pricing page sells a 10 GB block for ₦6,000 a year. The design notes say ₦100 per GB a year, which would make the same block ₦1,000. That is a sixfold gap.
*Why it matters:* This is customer-facing pricing, and a wrong figure on an invoice becomes a refund argument.
*Options:* (a) ₦6,000 per 10 GB block (what the site shows today); (b) ₦100 per GB, typed in by the customer; (c) another figure.
*Dev recommendation:* none stated.

**Q3. How do we present the saving for paying yearly: a lower monthly rate, or "two months free"?**
*Background:* The scope says "two months free". The design notes forbid that wording and say to show the lower monthly rate (for example Business ₦2,300 a month on a yearly term, ₦27,600 a year, against ₦2,500 monthly).
*Why it matters:* It is the headline offer on the pricing page, in checkout and in emails.
*Options:* (a) lower monthly rate; (b) "two months free".
*Dev recommendation:* lower monthly rate (the working assumption in the architecture document).

**Q4. Is the company VAT-registered, and should prices show VAT inside or on top?**
*Background:* Prices on the site exclude VAT. Checkout adds 7.5% on top (Business becomes ₦29,670). The scope requires VAT to be charged, recorded and remitted, and lists VAT registration as paperwork still to do.
*Why it matters:* If registration is not done we cannot lawfully charge VAT, and the display choice changes what customers believe they pay.
*Options:* (a) prices exclude VAT, added at checkout (as built); (b) prices include VAT. A second part: do dollar payments carry VAT too?

**Q5. Are the published refund terms the ones we want?**
*Background:* Full refund within 14 days of a first purchase; after that, unused whole months of a yearly plan; monthly plans are not refunded mid-month; credit for sustained outages without being asked.
*Why it matters:* Customers will quote it, and the scope wants it specific enough to settle disputes without argument.
*Options:* keep as written, or change the 14 days, the monthly rule or the outage credit.

**Q6. Should refunds above ₦20,000 need a second approver, and who are the approvers?**
*Background:* The scope says refunds are approved by "a named person". The architecture notes and the operations screens add a second approver above ₦20,000. That figure is not in the scope document.
*Why it matters:* It is a money-control rule and needs real people to exist before launch.
*Options:* (a) keep ₦20,000 with two approvers; (b) a different threshold; (c) one approver for all refunds.

**Q7. How should dollar prices and currency display work?**
*Background:* The scope has a $3 diaspora plan (10 GB). The site shows dollar prices on every plan ($1 to $5 a month on a yearly term). The launch schedule says to show each visitor their own currency by location; the site currently has a manual naira/dollar switch.
*Why it matters:* Dollar pricing hedges against a falling naira, and it changes payment setup.
*Options:* (a) manual switch (as built); (b) automatic by location; (c) naira only at launch.

---

## 2. Backend infrastructure

No project document gives a provider, server size or monetary budget for any question in this section. The only cost figure on file is the 2026 research estimate of about ₦1.8 million to build, which excludes the founder's own time.

**Q8. Which provider, server size and monthly budget do we approve for the mail server?**
*Background:* The mail software needs its own dedicated server, separate from the website host. Its internet address must be checked against spam blacklists before use. A second server is planned only after the six-month check.
*Why it matters:* A poor address or weak server harms every customer's delivery, and moving later means changing customers' settings.

**Q9. Is Amazon's Stockholm region acceptable for customer data, and do we apply for production access now?**
*Background:* Outgoing mail goes through Amazon in Stockholm, and credentials already exist. New accounts start in a test mode that can only send to verified addresses; release must be applied for and is not instant. The scope also warns that a Nigerian company does not automatically keep data in Nigeria, so every outside party touching customer data must be listed.
*Why it matters:* Without release, real customers cannot send mail.
*Options:* (a) Stockholm, apply now; (b) a different region; (c) wait.
*Dev recommendation:* apply now.

**Q10. Which legal entity will hold the Paystack account, and are the company registration documents ready?**
*Background:* Transfers, USSD and cards all run through Paystack, which requires a verified business account in the company name plus the CAC documents.
*Why it matters:* No payments means no revenue, and verification takes time.

**Q11. Which backup provider do we use, and how long do we keep backups?**
*Background:* Daily encrypted copies must be stored away from the mail server under separate credentials, with a practised restore before launch. Neither provider nor retention period is specified anywhere.
*Why it matters:* A restore that has never been tested is not a backup, and retention affects both cost and what we can promise customers.

**Q12. Which independent provider hosts the public status page?**
*Background:* It must run on a different provider from the application so it still loads when we are down.
*Why it matters:* It is a launch requirement in the scope.

**Q13. What is the monthly spending ceiling for Q8 to Q12, and is a test environment approved?**
*Background:* A test environment needs a second, smaller setup with Amazon's test mode and Paystack test keys.
*Why it matters:* Without it, payments and mail cannot be tried safely before customers use them.

**Q14. Who is the second administrator?**
*Background:* The scope requires a named, trained second person with access, plus written runbooks, before launch.
*Why it matters:* It is the answer to the "one person runs everything" risk, and a launch gate.

---

## 3. Dashboard and backend scope

**Q15. Do we keep the plan-selection screen in setup and the storage-management screen in the owner dashboard?**
*Background:* Neither is in the design index. The build team recorded both as live screens.
*Why it matters:* Dropping either changes the setup flow and how owners manage storage.
*Dev recommendation:* keep both (recorded as the working decision).

**Q16. Should webmail read mail directly from the mail server to start, or through a dedicated gateway service?**
*Background:* A gateway is faster at scale but is one more thing to run and pay for.
*Options:* (a) direct, behind a layer that can be swapped later; (b) gateway from day one.
*Dev recommendation:* (a), moving to (b) only if search proves too slow. Recorded as the working decision.

**Q17. Do agencies get limited access to client accounts in Phase 1, or can that wait?**
*Background:* Agencies would get scoped, expiring access the client can revoke. The site lists this under Premium only.
*Why it matters:* It touches the core security design, and adding it after launch means reworking how accounts are separated.
*Options:* (a) build for Phase 1; (b) defer, keeping the design ready.
*Dev recommendation:* none stated.

**Q18. When an account is locked for suspicious sending, is "sending stops, receiving continues" the experience you want, and who may lift a lock?**
*Background:* That is the designed behaviour, and the site's policies already promise it.
*Why it matters:* It is what a customer sees on the worst day, and it needs a named person with authority to lift it.

---

## 4. Everything else still open

**Q19. When a visitor enters a valid domain on the home page, should they go straight into setup, or see a results screen first?**
*Background:* Today they go straight to the first setup step, pre-filled. This was an assumption by the build team.
*Options:* (a) straight in (as built); (b) add a results screen first.

**Q20. What are the real WhatsApp number, support and billing email addresses, and where should contact-form messages go?**
*Background:* The contact form and WhatsApp button are not connected.
*Why it matters:* They are the main way customers reach us, and the site promises WhatsApp-first support.

**Q21. Who reviews the legal text, by when, and must we register with the data protection regulator?**
*Background:* Terms, privacy, acceptable use and refunds are drafted but not reviewed. The scope also asks whether the company crosses the registration threshold and needs a data protection officer.
*Why it matters:* Launch depends on it.

**Q22. Should the preview site stay open to anyone with the link, or get a shared password?**
*Background:* It is hidden from search engines but not protected.
*Options:* (a) leave as is; (b) add a shared password.

**Q23. Who writes the help articles, and which come first?**
*Background:* Guide links are placeholders.
*Why it matters:* The scope relies on self-service help to keep support cost down.

**Q24. Do you approve the name "Ziroemail", the wording added during the redesign, and the photo credits?**
*Background:* The name is one word, while the scope uses "Ziro Email". The added wording is the "Business email" badge and the support and FAQ lines on the home page. Photo credits are still marked to-do.

---

## Decision log

| Question | Decision | Date | Decided by |
|---|---|---|---|
| Q1 Per business or per person pricing? | | | |
| Q2 Extra storage price? | | | |
| Q3 Yearly saving: lower rate or free months? | | | |
| Q4 VAT: registered, inside or on top? | | | |
| Q5 Refund terms as published? | | | |
| Q6 Refund approval threshold and approvers? | | | |
| Q7 Dollar prices and currency display? | | | |
| Q8 Mail server provider, size, budget? | | | |
| Q9 Amazon Stockholm and production access? | | | |
| Q10 Paystack account holder and documents? | | | |
| Q11 Backup provider and retention? | | | |
| Q12 Status page host? | | | |
| Q13 Monthly budget ceiling and test environment? | | | |
| Q14 Second administrator? | | | |
| Q15 Two extra screens kept? | | | |
| Q16 Webmail: direct or gateway? | | | |
| Q17 Agency access in Phase 1? | | | |
| Q18 Sending-lock behaviour and who lifts it? | | | |
| Q19 Home page domain search handoff? | | | |
| Q20 WhatsApp number, emails, form destination? | | | |
| Q21 Legal review and regulator registration? | | | |
| Q22 Preview site privacy? | | | |
| Q23 Help articles: who and first? | | | |
| Q24 Name, added wording, photo credits? | | | |

# Ziroemail: where the build stands

Snapshot as of 18 October 2026. Written for a quick read before a conversation.

## 1. The four journeys through the product

**A visitor becomes a customer**
Homepage → sign up → confirm email → add their domain → choose a plan → set up mailboxes → their own dashboard

When someone signs up we store their password securely (we cannot read it ourselves), email them a six-digit code to prove the address is theirs, and only then let them in. The later steps (domain, plan, payment, mailboxes) are all on screen, but none of them does real work yet.

**A business owner runs their account**
Sign in (with an optional second step) → dashboard → mailboxes, domains, billing, team access

Sign-in is real: wrong passwords are slowed down, the owner is told about suspicious attempts, and they can see and end their own sessions. Everything they see after that is realistic sample data.

**Someone reads their email**
Sign in → inbox → search, contacts, settings → write and send

The screens work the way a real mailbox does: open, archive, delete with undo, compose, search. The messages in them are made up.

**Our staff keep the system healthy**
Staff sign in separately from customers (second step compulsory) → operations console → deliverability, abuse reports, refunds, backups

Staff accounts live apart from customer accounts, have a shorter session, and are created by us directly, never through a sign-up form. Every action in the console asks for a written reason. The figures and cases on the console are sample data.

## 2. What is built

| Part | State |
|---|---|
| Public website (home, pricing, features, switching, help, contact, status, legal) | Done and live on the team preview. The contact form is not connected to anything. |
| Sign-up, email code, sign-in, password reset, second-step login | Done and real. |
| Domain, plan, payment and phone-setup screens | Done as screens. Nothing behind them. |
| Owner dashboard (11 screens) | Done as screens. |
| Webmail (5 screens) | Done as screens. |
| Operations console (14 screens) | Done as screens. Only staff sign-in and each person's own security settings are real. |

All 30 screens were opened and clicked through in a browser on desktop and phone-size screens, and we ran an accessibility scan: no blocking problems. One older progress report (16 October) still says the sign-in and dashboard screens are "remaining". It is out of date; they are done.

## 3. Real versus demonstration

The product looks finished in a browser but is not processing real customers. What is genuinely working is limited to the account layer: signing up, the emailed confirmation code, signing in, passwords, the second login step, and sessions. Everything else shows realistic-looking sample data: the mailboxes, domains, invoices, inbox messages, delivery figures, abuse cases and refunds. Nothing is connected to a real mail server, a real payment provider, or a real domain checker, so no customer can yet receive email, pay, or have a domain verified.

## 4. The gaps that matter

- **No real email service for customers.** The mail server that will actually host customers' mailboxes has not been chosen or set up, so nobody can send or receive mail through Ziroemail yet.
- **No money can be taken.** Paystack is not connected, and the company paperwork it needs has not been confirmed.
- **The price is not final.** The scope document and the website describe two different pricing models (per person versus per business). The website shows per business. The extra-storage price also differs between sources (₦6,000 per 10 GB on the site, ₦100 per GB in the design notes).
- **Outgoing mail is not cleared for real customers.** Our Amazon sending account is still in test mode until we apply for release.
- **We cannot check a customer's domain yet.** The records customers must add are shown, but nothing verifies them.
- **Our own confirmation emails depend on a temporary mailbox.** They currently go out through a personal-use mail account for testing, which is fine for the team preview and not for launch.
- **Legal text is unreviewed.** Terms, privacy, acceptable use and refunds are drafted only.
- **Backups, a status page on separate hosting, and a second administrator** are launch requirements that have no owner or provider yet.

## 5. What we need from you, most blocking first

1. **Choose the pricing model.** Per business or per person. Checkout, invoices and the dashboard all follow it, and it is cheap to change now and costly once customers are billed.
2. **Approve the mail server provider, size and monthly budget.** Nothing involving real email can start until this exists.
3. **Name the company that will hold the Paystack account** and confirm the registration papers are ready. Verification takes time.
4. **Approve applying for Amazon sending release now.** Without it, real customers cannot send mail.
5. **Set the monthly spending ceiling** for servers, backups and the status page, and say whether we may build a test environment.
6. **Decide on two-factor for business owners.** The original scope said compulsory; we built it as strongly encouraged but optional, with staff compulsory. We need your ruling.
7. **Confirm the extra-storage price and whether prices include VAT.** Customers will quote whatever the invoice says.
8. **Name the second administrator** and choose the backup and status-page providers.
9. **Choose who reviews the legal text** and whether the company must register with the data-protection regulator.
10. **Give us the real WhatsApp number, support and billing emails**, and decide who writes the first help articles.

The full list of 24 questions, with options and our recommendations, is in the CEO questions document.

**The most important thing to know right now:** the whole product can be walked through in a browser, but it is a convincing prototype with a working sign-up in front of it; real mail, real payments and real domain checks do not exist yet, and they are blocked on your decisions about pricing, the mail server and the payment account.

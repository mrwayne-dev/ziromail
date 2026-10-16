// Question and answer copy shared by every page that shows FAQs, so a wording
// change is made once. Pass any subset to <Faq> and to faqSchema().

export const pricingFaqs = [
    {
        q: "Can two of my domains share one plan?",
        a: "No. Each domain needs its own plan. Storage is shared freely between mailboxes on the same domain, but never across domains. That separation is what stops one domain's sending problems affecting another's delivery.",
    },
    {
        q: "How many mailboxes can I create?",
        a: "As many as your pool supports. Ten staff on the 10 GB Starter plan works if their quotas add up to 10 GB. Give one person the whole pool if that suits you better. We do not charge per seat.",
    },
    {
        q: "What happens when the pool runs out?",
        a: "We warn you at 80% and again at 95%. Add the storage you need and it is available immediately, or lower a mailbox quota to free space. Mail is not deleted because a pool filled up. New mail queues while you sort it out.",
    },
    {
        q: "Can I change how storage is split later?",
        a: "Yes, whenever you like, from your dashboard. Lowering a quota below what a mailbox already uses is blocked until that mailbox clears some space, so nothing is lost.",
    },
    {
        q: "What if I reach my plan's ceiling?",
        a: "Starter tops out at 25 GB and Business at 100 GB. At that point you move to the next plan, keeping the same domain and mailboxes. Only the pool changes. Premium has no ceiling.",
    },
    {
        q: "Do you have a free trial?",
        a: "Not at the moment, and we would rather explain why than pretend it is an oversight. Free mailboxes are how spammers get into a mail service, and one of them can get every other customer's mail blocked. Every account here is paid and tied to a domain you can prove you own.",
    },
];

export const migrateFaqs = [
    {
        q: "Will we lose any email during the move?",
        a: "No. Your old mailbox keeps receiving until the MX record change takes effect, and anything that arrives there during the changeover is collected afterwards. Nothing is deleted at the old provider either. We copy, we do not move.",
    },
    {
        q: "Do my staff have to do anything?",
        a: "Each person sets up their phone once, which takes about thirty seconds from a WhatsApp link. On a computer, Outlook and Apple Mail usually find the new settings themselves after a password prompt.",
    },
    {
        q: "How long does the whole thing take?",
        a: "The setup is ten minutes. DNS changes usually take effect within thirty minutes, sometimes a few hours. The mail import runs in the background and depends on how much history you have. A few gigabytes is typically under an hour.",
    },
    {
        q: "Can we keep our old addresses working for a while?",
        a: "Yes. It is common to forward the old address into the new mailbox for a month or two while you update letterheads and tell customers. We will set that up with you.",
    },
    {
        q: "What about calendars and contacts?",
        a: "Contacts come across with your mail. Calendars work through your phone's own calendar app using the standard protocols. We do not have a built-in calendar screen yet, and we would rather say so than imply otherwise.",
    },
];

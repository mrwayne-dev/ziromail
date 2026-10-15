/*
 * PLACEHOLDER pricing data.
 *
 * The pricing model (per domain vs per seat) is undecided — see
 * docs/MARKETING_BUILD.md §5. These are the numbers the static prototype used
 * (per-domain, pooled storage). Nothing in the UI hard-codes a price; every page
 * reads this file, so deciding the model changes only this file's shape.
 *
 * Shaped the way the future Spatie Data class will return it:
 *   - money is integer minor units (kobo / cents)
 *   - each price has a `monthly` rate and a `yearly` total
 *
 * KNOWN SOURCE DISAGREEMENT, carried over unresolved:
 *   docs/design-source/ui/DESIGN.md §8 says extra storage is ₦100 per GB per year,
 *   but the prototype's pricing page sells a 10 GB block at ₦6,000 a year.
 *   `extraStorage` below follows the page (₦6,000 / 10 GB / year).
 */
export const plansFixture = {
    currencies: ['NGN', 'USD'],
    vatRate: 0.075,

    extraStorage: {
        blockGb: 10,
        price: {
            NGN: { monthly: 60000, yearly: 600000 },
            USD: { monthly: 120, yearly: 1200 },
        },
    },

    plans: [
        {
            code: 'starter',
            name: 'Starter',
            poolGb: 10,
            ceilingGb: 25, // null = no ceiling
            featured: false,
            price: {
                NGN: { monthly: 110000, yearly: 1200000 },
                USD: { monthly: 150, yearly: 1200 },
            },
            copy: {
                home: {
                    tagline: 'A proper address for a small team.',
                    features: ['Authentication set up for you', 'Phone setup by scanning a code', 'WhatsApp support'],
                },
                pricing: {
                    tagline: 'One domain, one small team.',
                    ceilingNote: 'Beyond that, move to Business.',
                    features: [
                        'Unlimited mailboxes within the pool',
                        'Authentication set up for you',
                        'Phone setup by scanning a code',
                        'WhatsApp support',
                    ],
                },
            },
        },
        {
            code: 'business',
            name: 'Business',
            poolGb: 30,
            ceilingGb: 100,
            featured: true,
            price: {
                NGN: { monthly: 250000, yearly: 2760000 },
                USD: { monthly: 350, yearly: 3000 },
            },
            copy: {
                home: {
                    tagline: 'For a business that lives in its inbox.',
                    features: [
                        'Everything in Starter',
                        'We import your old mail',
                        'Shared addresses and forwarding',
                        'More than one domain',
                    ],
                },
                pricing: {
                    tagline: 'One domain, a growing team.',
                    ceilingNote: 'Beyond that, move to Premium.',
                    features: [
                        'Everything in Starter',
                        'We import your old mail',
                        'Shared addresses and forwarding',
                        'Per-mailbox quota control',
                    ],
                },
            },
        },
        {
            code: 'premium',
            name: 'Premium',
            poolGb: 100,
            ceilingGb: null,
            featured: false,
            price: {
                NGN: { monthly: 500000, yearly: 5400000 },
                USD: { monthly: 700, yearly: 6000 },
            },
            copy: {
                home: {
                    tagline: 'For teams that keep everything.',
                    features: [
                        'Everything in Business',
                        'Automatic setup and migration',
                        'Roles, delegation and audit log',
                    ],
                },
                pricing: {
                    tagline: 'One domain, no ceiling.',
                    ceilingNote: null,
                    features: [
                        'Everything in Business',
                        'Automatic setup and migration',
                        'Roles, delegation and audit log',
                        'Named support contact',
                    ],
                },
            },
        },
    ],
};

export const plans = plansFixture.plans;
export const startingYearlyPrice = (currency = 'NGN') =>
    Math.min(...plans.map((p) => p.price[currency].yearly));

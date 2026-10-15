import { plans } from '../fixtures/plans';

// Product + offers, generated from the plan fixture so structured data can never
// drift from the prices shown on the page. (The static prototype had Starter at
// 18000 here while the page said ₦12,000.)
export function productSchema(siteUrl) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Ziroemail business email',
        description: 'Business email hosting priced per domain, with a storage pool shared across unlimited mailboxes.',
        brand: { '@type': 'Brand', name: 'Ziroemail' },
        offers: plans.map((plan) => ({
            '@type': 'Offer',
            name: plan.name,
            price: String(plan.price.NGN.yearly / 100),
            priceCurrency: 'NGN',
            description: `${plan.poolGb} GB shared storage, ${
                plan.ceilingGb ? `expandable to ${plan.ceilingGb} GB` : 'no expansion ceiling'
            }. One domain.`,
            url: `${siteUrl}/pricing`,
            availability: 'https://schema.org/InStock',
        })),
    };
}

// FAQPage from the same { q, a } list the page renders.
export function faqSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
        })),
    };
}

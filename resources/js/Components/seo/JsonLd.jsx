/*
 * Structured data as a <script type="application/ld+json"> element.
 *
 * Inertia's <Head> does not render nested components — a custom component inside
 * it ends up as a bogus tag — so this is a plain function that returns the
 * element. Call it, do not mount it:  <Head>{jsonLd(data, 'k')}</Head>
 * Also available as <JsonLd /> for use outside <Head>.
 */
export function jsonLd(data, key) {
    return (
        <script key={key} type="application/ld+json">
            {JSON.stringify(data).replace(/</g, '\\u003c')}
        </script>
    );
}

export default function JsonLd({ data }) {
    return jsonLd(data);
}

export function organizationSchema(siteUrl) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ziroemail',
        url: siteUrl,
        logo: `${siteUrl}/images/ziroemail-icon.png`,
        description: 'Business email hosting for Nigerian companies, on your own domain.',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Port Harcourt',
            addressRegion: 'Rivers State',
            addressCountry: 'NG',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@ziroemail.com',
            areaServed: 'NG',
            availableLanguage: 'English',
        },
    };
}

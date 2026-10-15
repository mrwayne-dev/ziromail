import { Head, usePage } from '@inertiajs/react';
import { jsonLd, organizationSchema } from './JsonLd';

const INDEXABLE = 'index, follow, max-image-preview:large';

/*
 * Per-page metadata: title, description, canonical, robots, Open Graph, Twitter
 * and JSON-LD. `path` is the page's own path ('/pricing'); the canonical and
 * og:url are built from the configured site URL so staging never claims
 * production's address by accident.
 *
 * `noindex` is for system pages. `schema` takes one object or an array of extra
 * structured-data blocks; the Organization block is added unless `organization`
 * is false.
 */
export default function Seo({
    title,
    description,
    path,
    ogTitle,
    ogDescription,
    noindex = false,
    robots,
    organization = true,
    schema,
    image = '/images/ziroemail-icon.png',
}) {
    const { site } = usePage().props;
    const url = site.url + path;
    const imageUrl = site.url + image;
    const blocks = [
        ...(organization ? [organizationSchema(site.url)] : []),
        ...(Array.isArray(schema) ? schema : schema ? [schema] : []),
    ];

    return (
        <Head title={title}>
            <meta name="description" content={description} />
            <meta name="robots" content={robots ?? (noindex ? 'noindex, nofollow' : INDEXABLE)} />
            {!noindex && <link rel="canonical" href={url} />}
            {!noindex && <meta property="og:type" content="website" />}
            {!noindex && <meta property="og:site_name" content="Ziroemail" />}
            {!noindex && <meta property="og:locale" content="en_NG" />}
            {!noindex && <meta property="og:url" content={url} />}
            {!noindex && <meta property="og:title" content={ogTitle ?? title} />}
            {!noindex && <meta property="og:description" content={ogDescription ?? description} />}
            {!noindex && <meta property="og:image" content={imageUrl} />}
            {!noindex && <meta name="twitter:card" content="summary_large_image" />}
            {!noindex && <meta name="twitter:title" content={ogTitle ?? title} />}
            {!noindex && <meta name="twitter:description" content={ogDescription ?? description} />}
            {!noindex && <meta name="twitter:image" content={imageUrl} />}
            {!noindex && blocks.map((data, i) => jsonLd(data, `ld-${i}`))}
        </Head>
    );
}

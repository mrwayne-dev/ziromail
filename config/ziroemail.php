<?php

return [
    /*
     * What customers must publish at their registrar so mail reaches us. These are facts about
     * our own mail platform, so they live in config, not in the pages. The DKIM key is a
     * placeholder until the mail server generates real per-domain keys.
     */
    'dns' => [
        'mx_host' => env('ZIRO_MX_HOST', 'mx.ziroemail.com'),
        'mx_priority' => 10,
        'spf_include' => env('ZIRO_SPF_INCLUDE', '_spf.ziroemail.com'),
        'dkim_selector' => 'ziro',
        'dkim_public_key' => env('ZIRO_DKIM_PUBLIC_KEY', 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f2Xn7pQ'),
        'dmarc_rua' => env('ZIRO_DMARC_RUA', 'dmarc@ziroemail.com'),
    ],

    'support' => [
        'whatsapp' => env('ZIRO_SUPPORT_WHATSAPP', ''),
        'whatsapp_link' => env('ZIRO_SUPPORT_WHATSAPP_LINK', ''),
        'email' => env('ZIRO_SUPPORT_EMAIL', 'support@ziroemail.com'),
        'hours' => 'Mon to Fri, 9am to 6pm WAT',
        'first_reply' => 'usually within the hour',
    ],

    /*
     * Shared secret the mail server signs its hourly count reports with. Empty closes the endpoint.
     * Set it in the server's .env only; it is never shown in a page or stored in the database.
     */
    'mail_events_secret' => env('MAIL_EVENTS_SECRET', ''),

    'limits' => [
        'mailboxes_per_hour' => 30,
        'domains_per_hour' => 10,
        'alias_changes_per_hour' => 60,
        'recheck_per_minute' => 3,
    ],
];

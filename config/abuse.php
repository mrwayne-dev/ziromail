<?php

/*
 * What the sending bot treats as unlike an account. Every threshold is per mailbox against its
 * own history, so a business that always sends 500 invoices a month is not flagged for doing it
 * again. The bot reads counts only (sent, bounced, complaints, new recipients), never message content.
 */
return [
    // Hourly volume this many times the mailbox's own average, and at least `min_volume` messages.
    'volume_multiple' => 5,
    'min_volume' => 50,

    // Below this many messages in the hour, percentages are noise and are not judged.
    'min_sample' => 20,
    'bounce_hour_pct' => 10.0,
    'complaint_pct' => 0.25,

    // `dry_run` records what the bot would have done and changes nothing. `live` acts on it.
    // Start in dry_run until real traffic has shown the thresholds are right.
    'mode' => env('ABUSE_MODE', 'dry_run'),

    // Share of an hour's messages the outbound filter flagged as bulk or phishing-like (it reports a count, never text).
    'filter_pct' => 50.0,

    // Until a domain's first payment clears, its mailboxes may send only this many messages an hour.
    'probation_per_hour' => 20,

    // Days of history that make up "the account's own average".
    'baseline_days' => 30,

    // Any rule tripping slows the mailbox. It is locked automatically only when volume is unusual
    // AND bounces or complaints are too: the combination that does not happen by accident.
    'auto_limit' => true,
    'auto_lock' => true,

    // While limited, the mail server is told to allow this many messages an hour.
    'limited_per_hour' => 20,
];

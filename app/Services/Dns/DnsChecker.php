<?php

namespace App\Services\Dns;

/** Looks up what a domain publishes. The real resolver arrives with the mail server. */
interface DnsChecker
{
    /**
     * @param  array<string, mixed>  $expected
     * @return array{status: string, observed: array<string, mixed>|null}
     */
    public function check(string $domain, string $type, array $expected): array;
}

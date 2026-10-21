<?php

namespace App\Services\Dns;

/** Checks nothing and says so. It never reports a record passing or failing, so no page can show an invented result. */
class FakeDnsChecker implements DnsChecker
{
    public function check(string $domain, string $type, array $expected): array
    {
        return ['status' => 'unchecked', 'observed' => null];
    }
}

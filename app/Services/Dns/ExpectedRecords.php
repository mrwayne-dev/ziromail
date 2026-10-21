<?php

namespace App\Services\Dns;

/** The four records every domain must publish, built from config. */
class ExpectedRecords
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function for(string $domain): array
    {
        $dns = config('ziroemail.dns');

        return [
            'MX' => ['host' => '@', 'value' => $dns['mx_host'], 'priority' => $dns['mx_priority']],
            'SPF' => ['host' => '@', 'value' => 'v=spf1 include:'.$dns['spf_include'].' ~all'],
            'DKIM' => ['host' => $dns['dkim_selector'].'._domainkey', 'value' => 'v=DKIM1; k=rsa; p='.$dns['dkim_public_key']],
            'DMARC' => ['host' => '_dmarc', 'value' => 'v=DMARC1; p=none; rua=mailto:'.$dns['dmarc_rua']],
        ];
    }
}

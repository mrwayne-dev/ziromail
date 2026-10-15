<?php

// Only named routes that browsers need are exposed in the page. Framework,
// documentation and tooling routes stay out of the client.
return [
    'except' => [
        'l5-swagger.*',
        'sanctum.*',
        'storage.*',
        'boost.*',
        'ignition.*',
        'debugbar.*',
    ],
];

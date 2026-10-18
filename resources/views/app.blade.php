<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0A0C0F">
    <link rel="icon" href="{{ asset('images/ziroemail-icon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/ziroemail-icon.png') }}">
    @routes(nonce: \Illuminate\Support\Facades\Vite::cspNonce())
    {{ Illuminate\Support\Facades\Vite::fonts() }}
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>
<body>
    @inertia
    <noscript>
        <p class="noscript-msg">
            Ziroemail needs JavaScript to show this page. Turn it on and reload, or email
            <a href="mailto:support@ziroemail.com">support@ziroemail.com</a> and we will help.
        </p>
    </noscript>
</body>
</html>

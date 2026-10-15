<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0A0C0F">
    <link rel="icon" href="{{ asset('images/ziroemail-icon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/ziroemail-icon.png') }}">
    @routes
    {{ Illuminate\Support\Facades\Vite::fonts() }}
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>
<body>
    @inertia
    <noscript>
        <p style="font-family:system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 20px;line-height:1.6">
            Ziroemail needs JavaScript to show this page. Turn it on and reload, or email
            <a href="mailto:support@ziroemail.com">support@ziroemail.com</a> and we will help.
        </p>
    </noscript>
</body>
</html>

/*
 * PLACEHOLDER account data for the screens between the marketing site and the
 * dashboards: sign-up, sign-in, two-factor, recovery, password reset, e-mail
 * verification, checkout and phone setup.
 *
 * There is no backend yet. Each key is shaped like the props the matching
 * controller will return, so replacing a fixture import with a page prop is a
 * one-line change. The `accepts` and `rejects` values below exist only so the
 * success and failure states can be reached; the real checks happen on the
 * server.
 *
 * Credentials that reach each state:
 *   sign-up       victory@adaobifoods.com is "already registered", anything else works
 *   sign-in       any address and password, except the password in `login.rejectedPassword`
 *   two-factor    the code in `twoFactor.acceptedCode`
 *   recovery      the code in `recovery.acceptedCode` (dashes optional)
 *   verify e-mail /verify-email?token=fixture-valid, or token=fixture-expired
 */
export const accountFixture = {
    user: {
        name: 'Victory Adaobi',
        business: 'Adaobi Foods Ltd',
        email: 'victory@adaobifoods.com',
    },

    signup: {
        passwordMinLength: 10,
        registeredEmails: ['victory@adaobifoods.com'],
    },

    login: {
        rejectedPassword: 'wrong-password',
    },

    twoFactor: {
        digits: 6,
        acceptedCode: '123456',
    },

    recovery: {
        acceptedCode: 'ABCD-EFGH-JKLM',
        total: 10,
        unused: 8,
    },

    verifyEmail: {
        expiresInHours: 24,
        resendAfterSeconds: 42,
        // What the link in the e-mail resolves to: /verify-email?token=...
        tokens: {
            'fixture-valid': 'confirmed',
            'fixture-expired': 'expired',
        },
    },

    checkout: {
        steps: [
            { key: 'plan', label: 'Plan' },
            { key: 'details', label: 'Details' },
            { key: 'payment', label: 'Payment' },
        ],

        methods: [
            {
                value: 'transfer',
                icon: '₦',
                title: 'Bank transfer',
                badge: 'Recommended',
                description:
                    'We give your business its own account number. Transfer from any Nigerian bank app and your mailboxes activate automatically.',
                detail:
                    'On the next screen you will see an account number to transfer into. Most transfers are detected within a minute or two. There is nothing to type in here.',
            },
            {
                value: 'ussd',
                icon: '*#',
                title: 'USSD',
                description: "Pay from any phone with your bank's code. No app and no card needed.",
                detail: 'We will show you the exact code to dial on the next screen.',
                banks: ['Access Bank', 'First Bank', 'Guaranty Trust Bank', 'United Bank for Africa', 'Zenith Bank', 'Kuda', 'Opay'],
            },
            {
                value: 'card',
                icon: '▣',
                title: 'Card',
                description: 'Any Nigerian naira card. Handled by Paystack, so your card details never touch our servers.',
                detail: "You will be taken to Paystack's secure page to enter your card, then brought straight back here.",
            },
            {
                value: 'usd',
                icon: '$',
                title: 'Pay in dollars',
                description: 'For paying from outside Nigeria, including paying for a business back home.',
                detail: 'Your total will be converted and shown in dollars before you confirm. International cards are accepted.',
            },
        ],

        // The business's own virtual account, shown while a transfer is awaited.
        transfer: {
            accountNumber: '9948201773',
            bank: 'Wema Bank',
            accountName: 'ZIRO / Adaobi Foods Ltd',
            expiresIn: 'In 23 hours',
        },
    },

    // What the phone-setup page is configuring: one mailbox and the shared server values.
    setup: {
        email: 'ibrahim@adaobifoods.com',
        qrUrl: 'https://ziroemail.com/setup/fixture-ibrahim',
        servers: {
            imap: { host: 'imap.ziroemail.com', port: 993, security: 'SSL/TLS' },
            smtp: { host: 'smtp.ziroemail.com', port: 587, security: 'STARTTLS' },
        },
    },
};

// PayPal frontend config. Loaded before the Smart Buttons SDK on
// /paypal-checkout.html. The Client ID is *public* — it's the same value
// PayPal puts into its example snippets. The Secret never lives in the
// browser; it stays in Supabase function secrets.
//
// To fill in:
//   1. developer.paypal.com → My Apps & Credentials → REST API apps → create app
//   2. Copy the Sandbox Client ID into PAYPAL_CLIENT_ID_SANDBOX
//   3. After Business-account upgrade, copy the Live Client ID into PAYPAL_CLIENT_ID_LIVE
//   4. Flip PAYPAL_ENV to "live" when you're ready

(function() {
    'use strict';

    // "sandbox" or "live"
    var PAYPAL_ENV = 'sandbox';

    var PAYPAL_CLIENT_ID_SANDBOX = 'REPLACE_WITH_SANDBOX_CLIENT_ID';
    var PAYPAL_CLIENT_ID_LIVE    = 'REPLACE_WITH_LIVE_CLIENT_ID';

    var clientId =
        PAYPAL_ENV === 'live' ? PAYPAL_CLIENT_ID_LIVE : PAYPAL_CLIENT_ID_SANDBOX;

    window.PAYPAL_CONFIG = {
        env: PAYPAL_ENV,
        clientId: clientId,
        currency: 'USD',
        // Smart Buttons SDK URL — assembled here so the checkout page just
        // does `<script src="..."></script>` against window.PAYPAL_CONFIG.sdkUrl.
        sdkUrl:
            'https://www.paypal.com/sdk/js' +
            '?client-id=' + encodeURIComponent(clientId) +
            '&currency=USD' +
            '&intent=capture' +
            '&disable-funding=credit,card' +
            '&components=buttons'
    };
})();

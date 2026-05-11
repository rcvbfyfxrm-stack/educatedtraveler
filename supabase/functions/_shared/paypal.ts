// PayPal Orders v2 helper (sandbox + live).
// Used by paypal-create-order and paypal-capture-order Edge Functions.
//
// Env vars expected:
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET — REST app credentials
//   PAYPAL_ENV                             — "sandbox" | "live"

const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").toLowerCase();
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";

export const PAYPAL_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured");
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expires_at - 30_000 > now) {
    return cachedToken.access_token;
  }

  const basic = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal OAuth failed: ${res.status} ${text}`);
  }

  const body = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    access_token: body.access_token,
    expires_at: now + body.expires_in * 1000,
  };
  return body.access_token;
}

export interface PayPalOrder {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    invoice_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
        seller_receivable_breakdown?: {
          gross_amount?: { value: string; currency_code: string };
          paypal_fee?: { value: string; currency_code: string };
          net_amount?: { value: string; currency_code: string };
        };
      }>;
    };
  }>;
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
  };
}

export interface CreateOrderInput {
  amountCents: number;
  currency: string;        // e.g. "USD"
  description?: string;    // shown on PayPal review (≤127 chars)
  customId?: string;       // our enrollment_id — echoed back on capture
  invoiceId?: string;      // optional human-friendly invoice number
  brandName?: string;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const value = (input.amountCents / 100).toFixed(2);

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency: same enrollment_id won't double-create an order
      ...(input.customId ? { "PayPal-Request-Id": `enr_${input.customId}` } : {}),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.customId,
          custom_id: input.customId,
          invoice_id: input.invoiceId,
          description: input.description?.slice(0, 127),
          amount: {
            currency_code: input.currency.toUpperCase(),
            value,
          },
        },
      ],
      application_context: {
        brand_name: input.brandName ?? "EducatedTraveler",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal createOrder failed: ${res.status} ${text}`);
  }
  return (await res.json()) as PayPalOrder;
}

export async function getOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal getOrder failed: ${res.status} ${text}`);
  }
  return (await res.json()) as PayPalOrder;
}

export async function captureOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Same Request-Id as create — PayPal will return the existing capture
        // if the buyer double-clicks instead of producing two charges.
        "PayPal-Request-Id": `cap_${orderId}`,
      },
      // Empty body is correct for capture-intent orders.
      body: "{}",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal captureOrder failed: ${res.status} ${text}`);
  }
  return (await res.json()) as PayPalOrder;
}

// Convenience: pull the first completed capture out of an order response.
export function extractCapture(order: PayPalOrder) {
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!capture) return null;
  return {
    capture_id: capture.id,
    status: capture.status,
    amount_cents: Math.round(parseFloat(capture.amount.value) * 100),
    currency: capture.amount.currency_code.toLowerCase(),
    paypal_fee_cents: capture.seller_receivable_breakdown?.paypal_fee
      ? Math.round(
          parseFloat(capture.seller_receivable_breakdown.paypal_fee.value) * 100,
        )
      : null,
  };
}

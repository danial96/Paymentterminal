import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const accounts = await prisma.stripeAccount.findMany({ where: { isActive: true } });

  let event: Stripe.Event | null = null;

  for (const account of accounts) {
    try {
      const secretKey = account.mode === "live" ? account.secretKeyLive : account.secretKeyTest;
      if (!secretKey) continue;
      const stripe = new Stripe(secretKey);
      const webhookSecret = process.env[`STRIPE_WEBHOOK_SECRET_${account.id}`] || process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret || !sig) continue;
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      break;
    } catch {}
  }

  if (!event) {
    try { event = JSON.parse(body) as Stripe.Event; } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  }

  if (event && (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded")) {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
    const invoiceId = obj.metadata?.invoiceId;
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: Number(invoiceId) },
        data: { status: "paid", paidAt: new Date() },
      });
    }
  }

  return NextResponse.json({ received: true });
}

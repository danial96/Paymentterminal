import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      stripeAccount: {
        select: { mode: true, secretKeyTest: true, secretKeyLive: true, publishableKeyTest: true, publishableKeyLive: true },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!invoice.stripeAccount) return NextResponse.json({ error: "No Stripe account linked" }, { status: 400 });

  const acc = invoice.stripeAccount;
  const secretKey = acc.mode === "live" ? acc.secretKeyLive : acc.secretKeyTest;
  const publishableKey = acc.mode === "live" ? acc.publishableKeyLive : acc.publishableKeyTest;
  if (!secretKey || !publishableKey) return NextResponse.json({ error: `No ${acc.mode} keys configured` }, { status: 400 });

  const stripe = new Stripe(secretKey);
  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];

  const totalAmount = Math.round(Number(invoice.total) * 100);

  // Use a single line item with the final total (after discount + tax) to ensure Stripe charges the correct amount
  const lineItems = totalAmount > 0 ? [{
    price_data: {
      currency: invoice.currency,
      unit_amount: totalAmount,
      product_data: { name: items.length === 1 ? items[0].description : `Invoice ${invoice.invoiceNumber}` },
    },
    quantity: 1,
  }] : items.map((item) => ({
    price_data: {
      currency: invoice.currency,
      unit_amount: Math.round(item.unitPrice * 100),
      product_data: { name: item.description },
    },
    quantity: item.quantity,
  }));

  const origin = req.headers.get("origin") ?? req.headers.get("referer")?.split("/invoice")[0] ?? "http://localhost:3000";

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: invoice.currency,
    metadata: { invoiceId: invoice.id.toString(), invoiceNumber: invoice.invoiceNumber },
  });

  // Mark as sent
  if (invoice.status === "draft") {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "sent", sentAt: new Date() } });
  }

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, publishableKey });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { invoiceScopeWhere } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: Number(id), ...invoiceScopeWhere(session.user) },
    include: { stripeAccount: { select: { mode: true, secretKeyTest: true, secretKeyLive: true, name: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!invoice.stripeAccount) return NextResponse.json({ error: "No Stripe account linked" }, { status: 400 });

  const acc = invoice.stripeAccount;
  const secretKey = acc.mode === "live" ? acc.secretKeyLive : acc.secretKeyTest;
  if (!secretKey) return NextResponse.json({ error: `No ${acc.mode} secret key configured` }, { status: 400 });

  const stripe = new Stripe(secretKey);

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];

  // Create price objects for each line item
  const lineItems = await Promise.all(
    items.map(async (item) => {
      const price = await stripe.prices.create({
        currency: invoice.currency,
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: { name: item.description },
      });
      return { price: price.id, quantity: item.quantity };
    })
  );

  // Apply discount coupon if invoice has a discount
  const discountAmount = Number((invoice as { discountAmount?: unknown }).discountAmount ?? 0);
  const discounts: { coupon: string }[] = [];
  if (discountAmount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(discountAmount * 100),
      currency: invoice.currency,
      duration: "once",
      name: `Discount on ${invoice.invoiceNumber}`,
    });
    discounts.push({ coupon: coupon.id });
  }

  const paymentLink = await stripe.paymentLinks.create({
    line_items: lineItems,
    ...(discounts.length > 0 && { discounts }),
    payment_method_collection: "if_required",
    metadata: {
      invoiceId: invoice.id.toString(),
      invoiceNumber: invoice.invoiceNumber,
    },
    after_completion: {
      type: "hosted_confirmation",
      hosted_confirmation: {
        custom_message: `Thank you! Your payment for ${invoice.invoiceNumber} has been received.`,
      },
    },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      stripePaymentLinkId: paymentLink.id,
      stripePaymentLinkUrl: paymentLink.url,
      status: "sent",
      sentAt: new Date(),
    },
  });

  return NextResponse.json({ url: paymentLink.url });
}

import { NextRequest, NextResponse } from "next/server";
import initStripe from "stripe";
import { supabaseRouteHandlerClient } from "@/app/utils/supabaseRouteHandlerClient";

export async function GET(
  req: NextRequest,
  { params }: { params: { priceId: string } }
) {
  const supabase = supabaseRouteHandlerClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user;

  if (!user) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const { data: stripe_customer_data } = await supabase
    .from("profile")
    .select("stripe_customer")
    .eq("id", user?.id)
    .single();

  const stripe = new initStripe(process.env.STRIPE_SECRET_KEY!);
  const priceId = params.priceId;

  const lineItems = [
    {
      price: priceId,
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    customer: stripe_customer_data?.stripe_customer as any,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/payment/cancelled`,
  });

  return NextResponse.json({
    id: session.id,
  });
}

export async function POST(req: NextRequest, res: NextResponse) {}

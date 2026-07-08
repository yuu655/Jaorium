import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

function isAuthorizedWebhookRequest(secret) {
  return secret === process.env.SUPABASE_WEBHOOK_SECRET;
}

export async function POST(req) {
  const secret = req.headers.get("x-webhook-secret");
  if (!isAuthorizedWebhookRequest(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const table = body.table;

  switch (table) {
    case "mentors":
      revalidateTag("mentors");
      break;
  }

  return NextResponse.json({ revalidated: true });
}

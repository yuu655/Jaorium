import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const table = body.table; // Supabase が送ってくるペイロード
//   console.log("Received webhook for table:", table);

  switch (table) {
    case "mentors":
    //   console.log("Revalidating mentors tag");
      revalidateTag("mentors", { expire: 0 });
      break;
    // case 'posts':
    //   revalidateTag('posts')
    //   break
  }

  return NextResponse.json({ revalidated: true });
}

// app/api/livekit-webhook/route.ts
import { WebhookReceiver, EgressClient, EncodedFileType } from "livekit-server-sdk";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const egressClient = new EgressClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

export async function POST(request) {
  const body = await request.text();
  const event = receiver.receive(body, request.headers.get("Authorization"));

  console.log("aa");

  switch (event.event) {
    case "room_started":
      await egressClient.startRoomCompositeEgress(
        event.room.name,
        {
          file: {
            fileType: EncodedFileType.MP4,
            filepath: `recordings/${event.room.name}/{time}.mp4`,
            s3: {
              accessKey: process.env.CLOUDFLARE_ACCESS_KEY_ID,
              secret: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
              bucket: process.env.CLOUDFLARE_BUCKET_NAME,
              region: "auto",
              // ここだけS3と違う：R2のエンドポイントを明示
              endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
              forcePathStyle: true, // R2では必須
            },
          },
        }
      );
      console.log(`録画開始: ${event.room.name}`);
      break;

    case "egress_ended":
      // 保存完了後にDBへURLを記録するならここ
      console.log(`録画保存完了: ${event.egressInfo?.fileResults?.[0]?.location}`);
      break;
  }

  return Response.json({ ok: true });
}

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
  const { searchParams } = new URL(request.url);
  const meeting_id = searchParams.get("id");

  const body = await request.text();
  const event = receiver.receive(body, request.headers.get("Authorization"));

  switch (event.event) {
    case "room_started":
      await egressClient.startRoomCompositeEgress(
        event.room.name,
        {
          file: {
            fileType: EncodedFileType.MP4,
            filepath: `recordings/${meeting_id}/{time}.mp4`,
            s3: {
              accessKey: process.env.CLOUDFLARE_ACCESS_KEY_ID,
              secret: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
              bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
              region: "ap-northeast-1",
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

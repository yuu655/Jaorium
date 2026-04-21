import { AccessToken } from "livekit-server-sdk";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");
  const userName = searchParams.get("userName");

  if (!roomName || !userName) {
    return Response.json({ error: "roomName と userName は必須です" }, { status: 400 });
  }

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: userName }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return Response.json({ token: await token.toJwt() });
}
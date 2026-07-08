import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

// ---- I/O（Supabase / LiveKit） ----

async function fetchCallerRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role;
}

async function fetchMeeting(supabase, meetingId) {
  const { data } = await supabase
    .from("meetings")
    .select("id, user, mentor")
    .eq("id", meetingId)
    .maybeSingle();
  return data;
}

async function isMeetingPaid(supabase, meetingId) {
  const { data } = await supabase
    .from("meeting_confirmations")
    .select("id")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  return Boolean(data);
}

async function createRoomAccessToken({ roomName, identity }) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

// ---- ハンドラ ----

// roomName = meetingId。トークンのidentityはクエリではなく認証済みユーザーのIDを使う
// （なりすまし防止）。参加者かつクレジット消費済み（meeting_confirmationsあり）の
// 面談にのみトークンを発行する。adminは運営監視用に無条件で発行。
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomName = searchParams.get("roomName");

  if (!roomName) {
    return Response.json({ error: "roomName は必須です" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const role = await fetchCallerRole(supabase, user.id);

  if (role !== "admin") {
    const meeting = await fetchMeeting(supabase, roomName);
    const isParticipant =
      meeting && (meeting.user === user.id || meeting.mentor === user.id);

    if (!isParticipant) {
      return Response.json({ error: "この面談に参加する権限がありません" }, { status: 403 });
    }

    if (!(await isMeetingPaid(supabase, roomName))) {
      return Response.json(
        { error: "クレジットの消費（支払い）が確認できていません" },
        { status: 402 },
      );
    }
  }

  const jwt = await createRoomAccessToken({ roomName, identity: user.id });

  return Response.json({ token: jwt });
}

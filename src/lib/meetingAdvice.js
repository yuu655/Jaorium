// メンターは面談資料に載せるアドバイスを入力するまでチャットを開けない。
// ただし終了済みの面談は対象外（この仕組みより前の面談で締め出されないように）。
export function mentorMustEnterAdvice({ isMentor, isFinished, adviceItems }) {
  if (!isMentor || isFinished) return false;
  return !(adviceItems?.length > 0);
}

export function adviceInputPath(meetingId, { required = false } = {}) {
  return `/dashboard/mentor/advice/${meetingId}${required ? "?required=1" : ""}`;
}

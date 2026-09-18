"use client";

import MentorAppointmentContent from "./MentorAppointmentContent";
import MentorTemplateContent from "./MentorTemplateContent";
import MentorPayout from "./MentorPayment";
import MentorProfile from "./MentorProfile";
import MentorDashboardShell from "./MentorDashboardShell";
import { MENTOR_DEFAULT_SIDE, MENTOR_TAB_KEYS } from "./MentorSidebar";
import { useSideTab } from "../common/useSideTab";
import { updateMentorProfile } from "../profile/actions";

// 面談可能日時は /dashboard/mentor/availability に切り出してあるので、
// ここで扱うのは MENTOR_TAB_KEYS のタブだけ。
export default function MentorDashboard({ profile, meetings, users, mentorTags, allTags, initialSide, unreadByMeeting = {} }) {
  const [side, setSide] = useSideTab(
    initialSide,
    MENTOR_TAB_KEYS,
    MENTOR_DEFAULT_SIDE,
  );

  return (
    <MentorDashboardShell
      profile={profile}
      meetings={meetings}
      side={side}
      setSide={setSide}
      unreadByMeeting={unreadByMeeting}
    >
      {side === "appointment" && (
        <MentorAppointmentContent meetings={meetings} users={users} unreadByMeeting={unreadByMeeting} />
      )}
      {side === "profile" && (
        <MentorProfile funcProfile={updateMentorProfile} profile={profile} mentorTags={mentorTags} allTags={allTags} />
      )}
      {side === "template" && <MentorTemplateContent />}
      {side === "payout" && (
        <MentorPayout profile={profile} currentUserId={profile.id} />
      )}
    </MentorDashboardShell>
  );
}

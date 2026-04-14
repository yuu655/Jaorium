"use client";
import { createClient } from "@/lib/supabase/client";
import Icon from "./icon";
import AddIcon from "./addIcon";
import { updateUserProfile, updateMentorProfile } from "./actions";
import { useState } from "react";

export default function Profile({ profile, isMentor }) {
  //   const [avatarUrl, setAvatarUrl] = useState();

  return (
    <>
      {isMentor && (
        <div>
          {/* <Icon size={100} url={profile.icon} /> */}
          <AddIcon
            format={"public/mentor"}
            uid={profile.id}
            onUpload={(inputFiles) => {
              updateMentorProfile(inputFiles);
            }}
            profile={profile}
          />
        </div>
      )}

      {!isMentor && (
        <div>
          {/* <Icon size={100} url={profile.icon} /> */}
          <AddIcon
            format={"private/user"}
            uid={profile.id}
            onUpload={(inputFiles) => {
              updateUserProfile(inputFiles);
            }}
          />
        </div>
      )}
    </>
  );
}

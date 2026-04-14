"use client";
import AddIcon from "@/components/dashboard/profile/addIcon";
import { updateUserIcon } from "@/components/dashboard/profile/actions";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

// import {
//   submitUser,
//   updateUserIcon,
// } from "@/components/dashboard/profile/actions";

export default function SetAccount() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      const supabase = await createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
            console.log("ユーザーデータ:", user);
        if (user) {
          setProfile(user);
        }
      });
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            アカウント登録
          </h1>
          <p className="text-xl text-gray-600">
            相談はユーザーで登録してください。
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="py-16">
            <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
              <AddIcon
                format="private/user"
                uid={profile?.id}
                // onUpload={(inputFiles) => updateUserIcon(inputFiles)}
                onUpload={(inputFiles) => updateUserIcon(inputFiles)}
                profile={profile}
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
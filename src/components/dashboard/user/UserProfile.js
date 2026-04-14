"use client";

import AddIcon from "../profile/addIcon";
import AddUserProfile from "./addUserProfile";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserProfile({ funcProfile, funcIcon, profile = null }) {
  return (
    <section className="py-16">
      <h3 className="text-2xl font-bold text-center mb-15">プロフィール編集</h3>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <label className="block text-sm font-medium mb-2">
          プロフィール情報
        </label>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* <AddUserProfile onUpload={updateUserProfile} profile={profile} /> */}
          <AddUserProfile onUpload={funcProfile} profile={profile} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <AddIcon
          format="private/user"
          uid={profile?.id}
          // onUpload={(inputFiles) => updateUserIcon(inputFiles)}
          onUpload={(inputFiles) => funcIcon(inputFiles)}
          profile={profile}
        />
      </div>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <Link href="/dashboard/delete">
          <Button variant="outline" className="w-full">
            アカウント削除
          </Button>
        </Link>
      </div>
    </section>
  );
}

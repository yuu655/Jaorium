"use client";

import AddIcon from "../profile/addIcon";
import AddMentorProfile from "./addMentorProfile";
import { Button } from "@/components/ui/button";
import { createStripeOnboarding } from "./actions";
import Link from "next/link";

export default function MentorProfile({ funcProfile, profile=null, mentorTags, allTags }) {
  return (
    <section className="py-16">
      <h3 className="text-2xl font-bold text-center mb-15">プロフィール編集</h3>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <label className="block text-sm font-medium mb-2">
          プロフィール情報
        </label>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <AddMentorProfile onUpload={funcProfile} profile={profile} mentorTags={mentorTags} allTags={allTags} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <AddIcon/>
      </div>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <Link href="/dashboard/delete">
          <Button variant="outline" className="w-full">
            アカウント削除
          </Button>
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <Link href="/dashboard/mentor/stripe/guide">
          <Button variant="outline" className="w-full">
            Stripe口座登録
          </Button>
        </Link>
      </div>
      {/* <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <button onClick={() => createStripeOnboarding()}>
          口座を確認する
        </button>
      </div> */}
    </section>
  );
}

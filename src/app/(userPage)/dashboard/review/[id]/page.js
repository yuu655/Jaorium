"use server";

import ReviewForm from "../component/reviewForm";
import { submitReview } from "../actions";
import Link from "next/link";

export default async function Review({ params }) {
  const { id } = await params;

  const submitReviewWithId = submitReview.bind(null, id);
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <Link
          href={`/dashboard/Interview/${id}`}
          className="text-red-500 hover:text-red-700 transition-colors shrink-0 text-xl"
        >
          <h1>※何かしらの不具合によりミーティングが終了してしまった場合はこちらをクリックしてください</h1>
        </Link>
        </div>
        <h1 className="text-center font-bold text-3xl py-20">レビューフォーム</h1>
        <ReviewForm func={submitReviewWithId} />
      </div>
    </div>
  );
}

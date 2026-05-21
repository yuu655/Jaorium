"use server";

import ReviewForm from "../component/reviewForm";
import { submitReview } from "../actions";

export default async function Review({ params }) {
  const { id } = await params;

  const submitReviewWithId = submitReview.bind(null, id);
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-center font-bold text-3xl py-20">レビューフォーム</h1>
        <ReviewForm func={submitReviewWithId} />
      </div>
    </div>
  );
}

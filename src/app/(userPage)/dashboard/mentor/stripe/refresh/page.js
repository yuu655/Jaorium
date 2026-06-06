// app/dashboard/mentor/stripe/refresh/page.js
"use client";
import { useEffect } from "react";
import { createStripeOnboarding } from "../../actions/mentorActions";

export default function RefreshPage() {
  useEffect(() => {
    createStripeOnboarding();
  }, []);

  return <p>リダイレクト中...</p>;
}
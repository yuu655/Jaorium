// app/dashboard/mentor/stripe/refresh/page.js
"use client";
import { useEffect } from "react";
import { createStripeOnboarding } from "@/components/dashboard/mentor/actions";

export default function RefreshPage() {
  useEffect(() => {
    createStripeOnboarding();
  }, []);

  return <p>リダイレクト中...</p>;
}
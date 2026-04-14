"use client";

export default function ExitButton({ redirectTo = '/' }) {
  const exit = async () => {
    await fetch(`/api/exit_draft?redirect=${redirectTo}`);
    window.location.href = redirectTo;
  };

  return <button onClick={exit}>プレビュー終了</button>;
}

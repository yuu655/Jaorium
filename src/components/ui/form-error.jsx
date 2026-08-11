import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// フォーム入力のバリデーションエラー表示用の共通パーツ。
// messageがfalsyなら何も描画しない。
export function FormError({ message, className }) {
  if (!message) return null;

  return (
    <p className={cn("flex items-center gap-1.5 text-sm text-red-500", className)}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

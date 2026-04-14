import { Calendar, CheckCircle } from "lucide-react";
import StatusUnit from "./statusUnit";

// user/mentor共通。お気に入り機能ができたら length を props で受け取るよう変更する
export default function StatusCode({ meetings }) {
  return (
    <>
      <StatusUnit
        name="予定中の相談"
        icon={<Calendar size={20} className="text-blue-600" />}
        length={meetings.next.length}
        unit="件"
      />
      <StatusUnit
        name="相談履歴"
        icon={<CheckCircle size={20} className="text-green-600" />}
        length={meetings.past.length}
        unit="件"
      />
    </>
  );
}

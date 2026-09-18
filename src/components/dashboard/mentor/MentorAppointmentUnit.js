import { Calendar, Clock, CheckCircle, CalendarClock } from "lucide-react";
import Icon from "../profile/icon";
import Link from "next/link";
import UnreadBadge from "../common/UnreadBadge";

export default function MentorAppointmentUnit({ appointment, user , unreadCount = 0 }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Icon size={70} url={user?.icon} />
          <div className="mx-6">
            <h3 className="font-bold text-lg">{user?.name}</h3>
            <p className="text-sm text-gray-600">{user?.grade}</p>
          </div>
        </div>

        {appointment.is_commit ? (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <CheckCircle size={16} />日時確定
          </span>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
            <CalendarClock size={16} />日時未定
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm">
            {appointment.is_commit ? appointment.date : "未定"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock size={18} className="text-gray-400" />
          <span className="text-sm">
            {appointment.is_commit ? appointment.time : "未定"}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded mb-4">
        <p className="text-sm text-gray-600 mb-1">相談内容</p>
        <p className="font-medium">{appointment.title}</p>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/dashboard/chat/${appointment.id}`}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            unreadCount > 0
              ? "border-blue-300 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          メッセージ
          <UnreadBadge count={unreadCount} />
        </Link>
      </div>
    </div>
  );
}

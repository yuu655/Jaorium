import { Calendar, Clock, CheckCircle, CalendarClock, MessageSquare } from "lucide-react";
import Icon from "../profile/icon";
import Link from "next/link";

export default function AdminAppointmentUnit({ appointment }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Icon size={70} url={appointment.mentor?.icon} />
          <div className="mx-6">
            <h3 className="font-bold text-lg">{appointment.mentor?.name}</h3>
            <p className="text-sm text-gray-600">{appointment.mentor?.university}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Icon size={70} url={appointment.user?.icon} />
          <div className="mx-6">
            <h3 className="font-bold text-lg">{appointment.user?.name}</h3>
            <p className="text-sm text-gray-600">{appointment.user?.grade}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {appointment.is_commit ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              <CheckCircle size={16} />日時確定
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              <CalendarClock size={16} />日時未定
            </span>
          )}
          {appointment.is_paid ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              <CheckCircle size={16} />支払い済み
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              <Clock size={16} />未払い
            </span>
          )}
        </div>
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
        {appointment.is_paid && (
          <Link
            href={`/dashboard/Interview/${appointment.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ミーティングに飛ぶ
          </Link>
        )}
        <Link
          href={`/dashboard/admin/chat/${appointment.id}`}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <MessageSquare size={16} />
          DMを確認
        </Link>
      </div>
    </div>
  );
}

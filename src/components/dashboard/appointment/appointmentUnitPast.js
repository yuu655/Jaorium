import { Calendar, Clock } from "lucide-react";
import Icon from "../profile/icon";

// past (is_finished=true) の予約カード。user/mentor共通で使用
export default function AppointmentUnitPast({ appointment, counterpart }) {
  // counterpart = userページならmentorオブジェクト、mentorページならuserオブジェクト
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <Icon size={60} url={counterpart?.icon} />
          <div>
            <h3 className="font-bold text-lg">{counterpart?.name}</h3>
            <p className="text-sm text-gray-600">
              {counterpart?.university ?? counterpart?.grade}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm">{appointment.created_at}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock size={18} className="text-gray-400" />
          <span className="text-sm">{appointment.time}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded mb-4">
        <p className="text-sm text-gray-600 mb-1">相談内容</p>
        <p className="font-medium">{appointment.title}</p>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          レビューを書く
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          もう一度予約
        </button>
      </div>
    </div>
  );
}

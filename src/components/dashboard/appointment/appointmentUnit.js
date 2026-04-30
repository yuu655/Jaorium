"use client";

import { Calendar, Clock, Video, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "../profile/icon";

const supabase = createClient();
export default function AppointmentUnit({ appointment, mentors, isMentor }) {
  const [mentor, setMentor] = useState();
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMentor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", appointment.mentor)
        .single();

      if (!error) {
        setMentor(data);
      }
      setLoading(false);
    };

    const fetchUser = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", appointment.user)
        .single();
      if (!error) {
        console.log(data);
        setUser(data);
      }
      setLoading(false);
    };

    isMentor ? fetchUser() : fetchMentor();
    // if (!isMentor) {
    //   mentors.forEach((element) => {
    //     if (element.id === appointment.mentor) {
    //       setMentor(element);
    //     }
    //   });
    // }
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          {isMentor ? (
            <div className="flex items-center">
              <Icon size={70} url={user.icon} />
              <div className="mx-6">
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.grade}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Icon size={70} url={mentor.icon} />

              <div className="mx-6">
                <h3 className="font-bold text-lg">{mentor?.name}</h3>
                <p className="text-sm text-gray-600">{mentor?.university}</p>
              </div>
            </div>
          )}
        </div>
        {appointment.is_commit ? (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            <CheckCircle size={16} />
            確定
          </span>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            <AlertCircle size={16} />
            承認待ち
          </span>
        )}
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
        {true ? (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Video size={18} />
            Zoomに参加
          </a>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
          >
            <Video size={18} />
            承認待ち
          </button>
        )}
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          メッセージ
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          変更
        </button>
      </div>
    </div>
  );
}

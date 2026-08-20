import { Star } from "lucide-react";
import Icon from "@/components/dashboard/profile/icon";

export default function MentorCard({ mentor, tagNames, reviewSum, onTagClick }) {
  return (
    <div className="bg-white rounded-2xl p-6.5 lg:p-8 shadow-[0_2px_16px_rgba(31,35,40,.06)] hover:-translate-y-0.75 hover:shadow-lg transition-all duration-200">
      <div className="flex gap-4.5 items-center mb-4.5">
        <div className="flex-none">
          <Icon size={80} url={mentor?.icon} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{mentor.university}</p>
          <div className="flex items-center gap-2 my-0.5">
            <p className="text-xl font-bold text-slate-900 truncate">
              {mentor.name}
            </p>
            {reviewSum > 0 && (
              <div className="flex gap-0.5 shrink-0">
                {Array.from({ length: reviewSum }, (_, i) => i).map((i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{mentor.faculty}</p>
        </div>
      </div>

      {tagNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tagNames.map(({ id, name }) =>
            onTagClick ? (
              <button
                key={id ?? name}
                type="button"
                onClick={() => onTagClick(id)}
                className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-600 whitespace-nowrap hover:bg-blue-100 transition-colors"
              >
                {name}
              </button>
            ) : (
              <span
                key={id ?? name}
                className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-600 whitespace-nowrap"
              >
                {name}
              </span>
            ),
          )}
        </div>
      )}

      {mentor.quote && (
        <p className="font-bold text-base text-slate-900 mb-2.5 leading-snug">
          {mentor.quote}
        </p>
      )}
      {mentor.bio && (
        <p className="text-sm text-slate-600 leading-loose line-clamp-4">
          {mentor.bio}
        </p>
      )}
    </div>
  );
}

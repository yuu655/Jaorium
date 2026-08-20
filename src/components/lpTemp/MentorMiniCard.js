import Icon from "@/components/dashboard/profile/icon";

export default function MentorMiniCard({ mentor, tagNames }) {
  return (
    <div className="flex-none w-52 lg:w-62.5 bg-white border border-slate-200 rounded-xl p-4 lg:p-4.5 flex gap-3.5 items-center hover:-translate-y-0.75 hover:shadow-lg transition-all duration-200">
      <div className="flex-none">
        <Icon size={54} url={mentor?.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-medium text-slate-900 truncate">
          {mentor.university}
        </p>
        <p className="text-xs text-slate-500 mb-2 truncate">{mentor.faculty}</p>
        <div className="flex flex-wrap gap-1.5">
          {tagNames.slice(0, 2).map((name) => (
            <span
              key={name}
              className="border border-slate-200 rounded-full px-2.5 py-1 text-[11px] text-slate-500 whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

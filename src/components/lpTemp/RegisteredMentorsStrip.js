import Link from "next/link";
import MentorMiniCard from "./MentorMiniCard";

export default function RegisteredMentorsStrip({ mentors, mentorTagsMap, tags }) {
  const tagNameById = Object.fromEntries((tags ?? []).map((t) => [t.id, t.name]));
  const strip = (mentors ?? []).slice(0, 8);

  if (strip.length === 0) return null;

  return (
    <section className="bg-slate-50/60 border-t border-slate-100 py-8 lg:py-12">
      <div className="max-w-350 mx-auto">
        <div className="px-6 mb-3 lg:mb-4 flex items-baseline justify-between">
          <p className="text-base font-medium text-slate-600">いま登録している先輩</p>
          <p className="hidden lg:block text-xs text-slate-500">← scroll →</p>
        </div>
        <div className="pl-6 overflow-x-auto">
          <div className="flex gap-3 lg:gap-4 pb-1 w-max">
            {strip.map((mentor) => (
              <MentorMiniCard
                key={mentor.id}
                mentor={mentor}
                tagNames={(mentorTagsMap?.[mentor.id] ?? []).map(
                  ({ tag_id }) => tagNameById[tag_id],
                ).filter(Boolean)}
              />
            ))}
            {/* <div className="flex-none w-52 lg:w-62.5 rounded-xl border border-slate-200 opacity-45" /> */}
          </div>
        </div>
        <div className="px-6 mt-3.5 text-right">
          <Link
            href="/mentors"
            className="text-base text-blue-700 hover:underline"
          >
            メンターを探す →
          </Link>
        </div>
      </div>
    </section>
  );
}

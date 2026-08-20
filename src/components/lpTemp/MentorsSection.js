import Link from "next/link";
import { Button } from "@/components/ui/button";
import MentorCard from "@/components/mentors/MentorCard";

export default function MentorsSection({ mentors, mentorTagsMap, tags }) {
  const tagById = Object.fromEntries((tags ?? []).map((t) => [t.id, t]));
  const featured = (mentors ?? []).slice(0, 10);

  return (
    <section className="bg-white py-14 lg:py-24">
      <div className="max-w-350 mx-auto">
        <div className="px-6 flex items-end justify-between mb-2 lg:mb-2.5">
          <h2 className="text-2xl lg:text-4xl font-bold text-slate-900">
            どんな先輩がいる？
          </h2>
          <p className="hidden lg:block text-base text-slate-500">← scroll →</p>
        </div>
        <p className="px-6 mb-6 lg:mb-9 text-base text-slate-600">
          現在<span className="font-bold text-lg lg:text-xl text-slate-700">{mentors?.length ?? 0}</span>
          人のメンターが登録しています。
        </p>

        <div className="pl-6 overflow-x-auto">
          <div className="flex gap-3.5 lg:gap-6 pb-1 w-max">
            {featured.map((mentor) => (
              <div key={mentor.id} className="w-70 lg:w-85 flex-none">
                <MentorCard
                  mentor={mentor}
                  tagNames={(mentorTagsMap?.[mentor.id] ?? [])
                    .map(({ tag_id }) => tagById[tag_id])
                    .filter(Boolean)}
                />
              </div>
            ))}
            {/* {featured.length > 0 && (
              <div className="flex-none w-70 lg:w-80 rounded-2xl border border-slate-200 opacity-45" />
            )} */}
          </div>
        </div>

        <div className="px-6 mt-6.5 lg:mt-13 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          <Button
            variant="outline"
            size="mentor"
            asChild
            className="w-full lg:w-auto rounded-lg border-1.5 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
          >
            <Link href="/mentors">メンター一覧を見る　→</Link>
          </Button>
          <Link
            href="/contact"
            className="text-base text-slate-600 underline underline-offset-4"
          >
            志望校の先輩が見つからない場合はこちら
          </Link>
        </div>
      </div>
    </section>
  );
}

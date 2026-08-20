import Link from "next/link";

export default function MobileStickyCta() {
  return (
    <div className="lg:hidden sticky bottom-0 z-40 bg-white/85 backdrop-blur-md border-t border-slate-100 px-5 py-3.5 pb-4">
      <Link
        href="/mentors"
        className="block text-center bg-amber-500 text-white rounded-full py-4 font-bold text-base shadow-lg shadow-amber-500/30"
      >
        無料でメンターを探す
      </Link>
    </div>
  );
}

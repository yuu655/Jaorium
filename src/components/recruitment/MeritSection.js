import Image from "next/image";

const merits = [
  {
    no: "01",
    title: (
      <>
        予定に縛られない<span className="text-blue-600">スポット型</span>
      </>
    ),
    body: "高校生があなたを選んだときだけ面談を行うので、塾バイトのように固定シフトはありません。自分の予定に合わせて、無理なく取り組めます。",
    image: "/forMentors_optimized/merit/1.webp",
  },
  {
    no: "02",
    title: (
      <>
        受験経験を<span className="text-blue-600">価値</span>に変えられる
      </>
    ),
    body: "今まで学校や塾などに無料で話していた受験体験を、必要としている高校生に直接届けられます。経験を活かしながら、報酬も受け取れます。",
    image: "/forMentors_optimized/merit/2.webp",
  },
  {
    no: "03",
    title: (
      <>
        <span className="text-blue-600">オンライン</span>でいつでも
        <br />
        どこからでもつながれる
      </>
    ),
    body: "すべてオンラインで完結するため、自宅でも外出先でも参加できます。場所に縛られず、自分の都合に合わせて無理なく続けられます。",
    image: "/forMentors_optimized/merit/3.webp",
  },
];

export default function MeritSection() {
  return (
    <section id="merit" className="bg-slate-50">
      <div className="mx-auto max-w-375 px-5.5 pt-9 pb-8.5 lg:px-14 lg:pt-21 lg:pb-22.5">
        <h2 className="mb-6 text-center text-[23px] leading-[1.55] font-bold text-[#1F2328] lg:mb-13 lg:text-[39px] lg:leading-[1.45] lg:tracking-tight">
          JaoRiumメンターになる
          <br className="lg:hidden" />
          <span className="lg:text-[50px] lg:text-blue-600">3</span>つのメリット
        </h2>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-7">
          {merits.map((merit) => (
            <div
              key={merit.no}
              className="flex flex-col rounded-xl border border-[#E4E7EB] bg-white px-4.5 py-5 transition-[transform,box-shadow] duration-200 lg:rounded-[14px] lg:px-8 lg:pt-9 lg:pb-8 lg:hover:-translate-y-[3px] lg:hover:shadow-[0_8px_24px_rgba(31,35,40,.08)]"
            >
              <p className="mb-3 text-[26px] leading-none font-bold text-blue-600 lg:mb-2.5 lg:text-[44px]">
                {merit.no}
              </p>
              <div className="mb-5.5 hidden gap-1.25 lg:flex">
                <span className="h-1.25 w-1.25 rounded-full bg-[#BFD1F5]" />
                <span className="h-1.25 w-1.25 rounded-full bg-[#BFD1F5]" />
                <span className="h-1.25 w-1.25 rounded-full bg-[#BFD1F5]" />
              </div>
              <h3 className="mb-2.5 text-lg leading-relaxed font-bold text-[#1F2328] lg:mb-4 lg:text-[23px]">
                {merit.title}
              </h3>
              <p className="mb-4 text-[14px] leading-loose text-[#5A626C] lg:mb-7 lg:text-[15.5px] lg:leading-[1.95]">
                {merit.body}
              </p>
              <div className="relative mt-auto h-30 overflow-hidden rounded-lg bg-slate-50 lg:h-50 lg:rounded-[10px]">
                <Image src={merit.image} alt="" fill className="object-contain" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client"
import dynamic from 'next/dynamic';

const PdfSlider = dynamic(() => import('@/components/PdfSlider'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});


export default function MentorTemplateContent() {
  return (
    <section className="py-16">
      <h3 className="text-2xl font-bold text-center mb-15">スライドテンプレート</h3>
      <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
        <PdfSlider fileUrl="/templateSlide.pdf" pptxUrl={"/templateSlide.pptx"} />
      </div>
    </section>
  );
}
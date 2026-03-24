import Image from "next/image";
import ExitButton from "../components/button";
import { Calendar, User, Tag, Heart, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Blog({ isDraft, result }) {
  // console.log(result);
  return (
    <>
      <div className="relative h-96 bg-linear-to-br from-gray-100 to-gray-200">
        <Image
          src="/photo-1456513080510-7bf3a84b82f8.jpg"
          alt={result.title}
          width={result.eyecatch.width}
          height={result.eyecatch.height}
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full mb-4">
              {result.category.name}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {result.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{result.updatedAt}</span>
            </div>
            {/* <div className="flex items-center gap-2">
              <User size={18} />
              <span>{result.author.name}</span>
              {result.author.university && (
                <span className="text-gray-400">（{result.author.university}）</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tag size={18} />
              <div className="flex gap-2">
                {result.author.specialties.map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-200 rounded text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: result.content }} />
        </div>
      </article>
      {isDraft && <ExitButton redirectTo="/" />}

      {/* <div className="relative h-[400px] bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full mb-4">
              {result.category.name}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {result.title}
            </h1>
          </div>
        </div>
      </div> */}
    </>
  );
}

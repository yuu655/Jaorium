import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Article({ category, time, title, id }) {
  return (
    <>
    <Link href={`/articles/${id}`}>
      <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">
            {category}
          </span>
          <span className="text-sm text-gray-500">{time}</span>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-blue-600 text-sm hover:underline">続きを読む →</p>
      </div>
    </Link>
      {/* <div className="h-full p-10 bg-white rounded-lg shadow-md">
        <Button className="bg-blue-500" asChild>
          <Link className="text-sm" href="/">
            予約
          </Link>
        </Button>

        <h2 className="text-2xl text-center p-5 font-bold">{title}</h2>
        <p className="text-2sm text-center">
          {category} {time}
        </p>
      </div> */}
    </>
  );
}

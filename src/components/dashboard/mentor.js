import { Search, MapPin, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Mentor({
  // icon_url,
  // name,
  // university,
  // faculty,
  // region,
  // specialties,
  mentor,
}) {
  
  return (
    <>
      {/* <div className="h-full p-10 bg-white rounded-lg shadow-md">
        <Image
          alt="icon"
          src={icon_url}
          width={80}
          height={80}
          className="w-18 h-18 mx-auto rounded-full object-cover"
        />
        <h2 className="text-2xl text-center p-5 font-bold">{name}</h2>
        <p className="text-2sm text-center">
          {university} {faculty}
        </p>
        <p className="text-2sm text-center pt-2 pb-3 text-gray-500">
          出身：{region}
        </p>
        <p className="text-sm text-center text-gray-700 bg-sky-100 rounded-sm py-1">
          {specialties.join(", ")}
        </p>
      </div> */}
      <div
        key={mentor.id}
        className="bg-white border flex-1 text-center border-gray-200 rounded-xl p-6 hover:shadow-xl transition-shadow"
      >
        {/* Avatar */}
        <div className="w-24 h-24 bg-linear-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-4">
          {/* <Image
          alt="icon"
          src={mentor.icon.url}
          width={80}
          height={80}
          className="w-24 h-24 mx-auto rounded-full object-cover"
          /> */}
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-center mb-2">{mentor.name}</h3>

        {/* University */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap size={16} className="text-gray-600" />
          <p className="text-gray-700">
            {mentor.university} {mentor.faculty}
          </p>
        </div>

        {/* Region */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin size={16} className="text-gray-600" />
          <p className="text-sm text-gray-600">出身：{mentor.region}</p>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Specialties */}
        {/* <div className="flex flex-wrap gap-2 justify-center mb-4">
          {mentor.specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div> */}

        <Button variant="default" className="bg-blue-500" asChild>
          <Link href={`/dashbord/booking/${mentor.id}`}>
            相談する
          </Link>
        </Button>
      </div>
    </>
  );
}

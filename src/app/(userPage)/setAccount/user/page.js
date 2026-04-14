// "use client";
// import AddIcon from "@/components/dashboard/profile/addIcon";
// import { updateUserIcon } from "@/components/dashboard/profile/actions";

// import { createClient } from "@/lib/supabase/client";
// import { useState, useEffect } from "react";

// // import {
// //   submitUser,
// //   updateUserIcon,
// // } from "@/components/dashboard/profile/actions";

// export default function SetAccount() {
//   const [profile, setProfile] = useState(null);
//   useEffect(() => {
//     const fetchData = async () => {
//       const supabase = await createClient();
//       supabase.auth.getUser().then(({ data: { user } }) => {
//             console.log("ユーザーデータ:", user);
//         if (user) {
//           setProfile(user);
//         }
//       });
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="bg-white min-h-screen">
//       {/* Header */}
//       <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h1 className="text-4xl md:text-5xl font-bold mb-6">
//             アカウント登録
//           </h1>
//           <p className="text-xl text-gray-600">
//             相談はユーザーで登録してください。
//           </p>
//         </div>
//       </section>

//       {/* Booking Form */}
//       <section className="py-16">
//         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//           <section className="py-16">
//             <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
//               <AddIcon
//                 format="private/user"
//                 uid={profile?.id}
//                 // onUpload={(inputFiles) => updateUserIcon(inputFiles)}
//                 onUpload={(inputFiles) => updateUserIcon(inputFiles)}
//                 profile={profile}
//               />
//             </div>
//           </section>
//         </div>
//       </section>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

import AddIcon from "@/components/dashboard/profile/addIcon";
import AddUserProfile from "@/components/dashboard/user/addUserProfile";

import { submitUser } from "../actions";
import {
  updateUserIcon,
} from "@/components/dashboard/profile/actions";

export default function SetAccount() {
  // const [role, setRole] = useState("");
  const [isIcon, setIsIcon] = useState(false);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    const fetchAllTags = async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from("tags").select("*");
      setAllTags(data ?? []);
    };

    fetchAllTags();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            アカウント登録
          </h1>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="py-16">
            <h3 className="text-2xl font-bold text-center mb-15">
              プロフィール編集
            </h3>
            <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
              <label className="block text-sm font-medium mb-2">
                プロフィール情報
              </label>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                {/* <AddUserProfile onUpload={updateUserProfile} profile={profile} /> */}
                <AddUserProfile
                  onUpload={submitUser}
                  profile={null}
                  setIsIcon={setIsIcon}
                />
              </div>
            </div>
            {isIcon && (
              <div className="max-w-3xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
                <button onClick={() => setIsIcon((prev) => !prev)}>
                  戻る
                </button>
                <AddIcon
                  format="private/user"
                  uid={null}
                  // onUpload={(inputFiles) => updateUserIcon(inputFiles)}
                  onUpload={(inputFiles) => updateUserIcon(inputFiles)}
                  profile={null}
                />
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Info Section */}
      {/* <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">予約の流れ</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold mb-2">予約リクエスト</h3>
              <p className="text-sm text-gray-600">
                フォームから希望の日時とメンターを選択
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold mb-2">メンター確認</h3>
              <p className="text-sm text-gray-600">
                メンターが日程を確認し、メールで返信
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold mb-2">オンライン相談</h3>
              <p className="text-sm text-gray-600">
                ZoomやGoogle Meetで相談開始
              </p>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}

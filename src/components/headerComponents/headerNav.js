import Link from "next/link";
import { Button } from "../ui/button";

export default function HeaderNav({ nav_list }){
    return(
          <ul className="hidden md:flex items-center space-x-5">
            {nav_list.map((item) => {
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-black hover:text-blue-500 font-bold text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
            {/* <li><button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">予約</button></li> */}
            <li>
              <Button className="bg-orange-500" asChild>
                <Link className="text-sm" href="/signup/user">予約する</Link>
              </Button>
            </li>
            <li>
              <Button className="bg-blue-500" asChild>
                <Link className="text-sm" href="/signup/mentor">メンターになる</Link>
              </Button>
            </li>
            <li>
              <Button className="bg-gray-500" asChild>
                <Link className="text-sm" href="/login">ログインする</Link>
              </Button>
            </li>
          </ul>
    );
}
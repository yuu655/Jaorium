import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react'
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
export default function DrawerWithSides({nav_list}) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button className="md:hidden p-2" aria-label="メニュー">
          <Menu size={24} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>JaoRium</DrawerTitle>
          <DrawerDescription>情報戦に、終止符を。</DrawerDescription>
        </DrawerHeader>
        <div className="no-scrollbar overflow-y-auto px-4">
          <ul className="space-x-5">
            {nav_list.map((item) => {
              return (
                <li key={item.name} className="my-10">
                  <Link
                    href={item.href}
                    className="text-black hover:text-blue-500 text-xl"
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
            {/* <li><button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">予約</button></li> */}
            <li>
              <Button className="bg-orange-500 mb-10" asChild>
                <Link className="text-sm" href="/signup/user">予約する</Link>
              </Button>
            </li>
            <li>
              <Button className="bg-blue-500 mb-10" asChild>
                <Link className="text-sm" href="/signup/mentor">メンターになる</Link>
              </Button>
            </li>
            <li>
              <Button className="bg-gray-500" asChild>
                <Link className="text-sm" href="/login">ログインする</Link>
              </Button>
            </li>
          </ul>
        </div>
        {/* <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}

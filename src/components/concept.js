import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Concept() {
  return (
    <div className="bg-slate-200">
      <div className="max-w-300 mx-auto px-4">
        <div className="md:flex md:items-end md:justify-center py-30 gap-20">
          <div>
            <h2 className="md:text-4xl text-3xl font-sans pb-13">
              経済格差が、情報の格差になってはいけない。
            </h2>
            <p className="md:text-3xl text-2xl font-thin font-sans">
              受験のノウハウなど、
              <br />
              お金を払ってしか得られないものも多い。
            </p>
            <p className="md:text-3xl text-2xl font-thin font-sans">
              ネットにある無料情報は、上辺だけの話も多い。
            </p>
            <p className="md:text-3xl text-2xl font-thin font-sans">
              だからじゃおりうむは、
            </p>
            <h2 className="md:text-3xl text-2xl font-thin font-sans">
              無料でリアルな一次情報をあなたに届ける
            </h2>
          </div>

          <Button variant="noBG" size="noBG" className="pt-20 md:pt-0" asChild>
            <Link className="text-[25px] font-thin" href="/concept">コンセプト</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

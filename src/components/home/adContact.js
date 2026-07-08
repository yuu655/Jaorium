import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function AdContact() {
  return (
    <>
      <div className="flex flex-col max-w-300 overflow-hidden justify-center m-auto py-30">
        <h2 className="text-4xl text-center pb-10 font-bold">合格した人しか持っていない、<br/>リアルな情報を。</h2>
        <p className="text-xl  text-center pb-10">まずは無料で体験。</p>
        {/* <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-[25px] text-center pb-40">「知らなかった」で夢を諦める人を、ゼロにする。</p>
        </div> */}
        <div className="flex justify-center">
            
        <Button className="bg-blue-500" size="normal" asChild>
            <Link className="text-[20px]" href="/signup">メンターに相談する</Link>
        </Button>
        </div>
      </div>
    </>
  );
}

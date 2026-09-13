"use client";

import { useCallback, useState } from "react";

// ダッシュボードのタブ状態。ローカルstateのまま即時に切り替えつつ、URLの ?side= も追従させる。
// router.replace を使うとsearchParamsの変化でRSCの再取得が走りタブ切替が遅くなるので、
// App Routerが公式に許容している window.history.replaceState で浅くURLだけ書き換える。
//
// validSides に無い値（例: 独立ルートへ切り出したタブのキーがURLに残っている場合）は
// fallback に丸める。履歴は積まないので戻るボタンでのタブ移動は対象外。
// validSides は identity が毎レンダー変わらないようモジュール定数を渡すこと。
export function useSideTab(initialSide, validSides, fallback = "appointment") {
  const [side, setSide] = useState(() =>
    validSides.includes(initialSide) ? initialSide : fallback,
  );

  const selectSide = useCallback(
    (next) => {
      const target = validSides.includes(next) ? next : fallback;
      setSide(target);

      const url = new URL(window.location.href);
      if (target === fallback) url.searchParams.delete("side");
      else url.searchParams.set("side", target);
      window.history.replaceState(null, "", url);
    },
    [validSides, fallback],
  );

  return [side, selectSide];
}

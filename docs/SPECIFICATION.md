# JaoRium 仕様書

最終更新: 2026-07-08
対象コードベース: このリポジトリの `src/` 一式（Next.js App Router）

本書はソースコードおよびSupabaseスキーマの精査に基づいて作成した「現状仕様（as-is）」です。将来仕様や意図の推測を含む箇所には「要確認」と明記しています。

---

## 1. サービス概要

JaoRium（jaorium.com）は、大学受験生（**ユーザー**）が、実際に難関大学等へ進学した先輩（**メンター**）に、オンラインビデオ面談で相談できるマッチングプラットフォームである。

- ユーザーは「クレジット」を購入し、1クレジットにつき1回の相談（オンライン面談）を予約できる。
- メンターは相談に対応した実績に応じて報酬が発生し、Stripe Connect経由で銀行口座へ振り込まれる。
- 相談前後のやり取り（日程調整・面談実施・終了処理・レビュー）はすべてサイト内の「チャット」画面で完結する。

---

## 2. ユーザーロール

`profiles.role`（enum: `pending` / `user` / `mentor` / `admin`）で管理される。

| ロール | 説明 |
|---|---|
| `pending` | サインアップ直後、まだ役割が確定していない状態（デフォルト値） |
| `user` | 受験生。メンターを検索し、相談を予約する側 |
| `mentor` | メンター。相談を受け、報酬を得る側 |
| `admin` | 運営者。メンター審査・相談状況の閲覧などを行う |

**役割確定の仕組み（DBトリガー `protect_role_update`）**:
- `role` が `pending` の間は1回だけ `user`/`mentor`/`admin` への変更が許可される。
- 一度 `pending` 以外になった後は、`service_role`キー（サーバー管理者操作）または `postgres` ユーザー以外からの変更は例外を発生させて拒否される（ロールの後からの変更を禁止する設計）。

> **要確認**: 上記トリガーにより最初の1回だけ role を `pending` から `user`/`mentor` に変更できるが、アプリケーションコード（`src/`）内には `profiles.role` を更新する処理が見当たらない。現状、本番DBには `user`23件・`mentor`23件・`admin`2件・`pending`3件のデータが存在するため、何らかの方法（Supabase管理画面からの手動更新、または本書の対象外の仕組み）で設定されていると考えられる。新規サインアップしたユーザーの role がどの経路で `pending` から確定するのか、コードベースからは特定できなかった。運用上の重要な穴である可能性があるため、要確認。

---

## 3. 認証・オンボーディングフロー

### 3.1 サインアップ
- `/signup/user`, `/signup/mentor` — メールアドレスのみを入力し、OTP（8桁コード）をメール送信する方式（パスワード不要）。`email_exists` RPCで既存メールアドレスを事前チェックする。
- Googleログイン（OAuth）も両ページで提供。
- OTP認証成功後、`/setAccount/user` または `/setAccount/mentor` へリダイレクトされる。
- Googleログインの場合は `handle_new_user` トリガーにより `profiles` テーブルへ自動的に行が作成される（`raw_user_meta_data->>'full_name'` から名前を取得）。

> **既知の残骸**: `signup/user/actions.js` の `signupMentor` と `signup/mentor/actions.js` の `signupUser` は、パスワード方式の旧サインアップ実装で、現在どちらのページからもimportされていない未使用コード。削除はせず現状のまま残している。

### 3.2 アカウント初期設定（オンボーディング）
`profiles.set`（boolean）で完了状態を管理する。

- **ユーザー** (`/setAccount/user`): ユーザーネーム（必須）、学年（高校1〜3年生／浪人生／その他）を入力し、`users` テーブルへ登録。続けて `/setAccount/user/icon` でアイコン画像をアップロード。
- **メンター** (`/setAccount/mentor`): ユーザーネーム・大学・学部（必須）、自己紹介、出身地域、タグ（複数選択）を入力し、`mentors` テーブルおよび `mentor_tags` テーブルへ登録。続けて `/setAccount/mentor/icon` でアイコン画像をアップロード。
- 未完了（`set = false`）のユーザーがログインすると、middlewareにより強制的にこの画面へ誘導される（4章参照）。

### 3.3 ログイン・ログアウト・パスワードリセット
- `/login` — メールアドレス+パスワード、またはGoogleログイン。
- `/reset` → `resetPasswordForEmail` でリセットメール送信 → `/api/auth/resetpass` でコード交換 → `/resetPass` で新パスワード設定。
- ログアウトは `POST /api/auth/signout`。
- アカウント削除は `DELETE /api/auth/delete-account`（`/dashboard/delete` 画面から呼び出し、Supabase Authユーザー自体を削除）。

---

## 4. アクセス制御（ルーティングルール）

`src/middleware.js` → `src/lib/supabase/proxy.js` の `updateSession()` が全リクエストで実行され、以下を行う。

1. Supabaseセッションの検証・Cookieの更新。
2. `profiles.role` を取得。
3. **未ログイン**の場合、`/dashboard`・`/admin`・`/setAccount`・`/resetPass` 配下へのアクセスを `/login` へリダイレクト。
4. **ログイン済み**の場合、role に応じて以下のように強制リダイレクトする。ただし**リダイレクト先が現在のパスと同じ場合は何もしない**（例: `set = false` のユーザーが `/setAccount/user` に滞在・フォーム送信している間は、自己リダイレクトのループにならずそのまま通す）。
   - `admin`: `/dashboard`・`/dashboard/user`・`/dashboard/mentor`・`/setAccount`配下・`/` へのアクセスは `/dashboard/admin` へ。
   - `user`: `/setAccount/mentor` は `/dashboard/user` へ。`/setAccount`・`/`・`/login`・`/signup`配下・`/dashboard`・`/dashboard/mentor` は、`profiles.set` が `false` なら `/setAccount/user` へ、`true` なら `/dashboard/user` へ。
   - `mentor`: 上記の user/mentor を入れ替えた同様のルール。

---

## 5. 機能仕様

### 5.1 メンター検索・一覧（`/mentors`、トップページのメンター紹介セクション）

- 全メンターのうち `mentors.is_allowed = true` かつ `mentor_secret.admin_allow = true` の両方を満たすメンターのみが一般公開される（`is_allowed` はメンター本人のプロフィール公開設定、`admin_allow` は運営の承認フラグと考えられる。5.6節参照）。
- キーワード検索（名前・大学・学部の部分一致、スペース区切りAND検索）。
- タグによる絞り込み（`tags.category` ごとにグルーピングして表示。カテゴリラベル: 受験形式／大学・学部／大学生活／キャリア／環境／得意教科）。
- 「かんたん診断」機能: 3問の選択式アンケート（興味分野／大学生活で重視すること／受験形式）の回答からキーワードを収集し、該当するタグを自動選択して絞り込む。
- トップページには診断結果からの上位3名（`admin_allow = true` に限定）を表示、`/mentors` では全件を表示。

### 5.2 相談予約（Booking）

- ユーザーがメンター詳細から相談を申し込む（`/dashboard/booking/[mentorId]`）。
- フォーム項目: 相談内容（プルダウン: 受験勉強全般／志望校選び／学部選択／勉強方法／モチベーション／地方からの受験／その他）、および自由記述4項目（困ったエピソード／取った行動／未解決点／今回得たい情報）。
- 予約が成立すると `meetings` テーブルに行が作成され、メンター・ユーザー双方にResendで通知メールが送信される。
- 予約直後は `/dashboard/chat/[meetingId]` へ遷移し、以降のやり取りはすべてチャット画面上で行う。

### 5.3 チャット・日程調整・面談実施（`/dashboard/chat/[meetingId]`）

一連の状態は `meetings`（面談本体）と `meeting_schedules`（日程確定状態: `date`/`time`/`is_commit`/`is_finished`）で管理する。

1. **メッセージ送受信**: `messages` テーブルへ保存。通常のテキストメッセージと、日程提案メッセージ（`type: "date_proposal"`, 内容は `"YYYY-MM-DD|HH:MM"` 形式）の2種類がある。
2. **日程確定**: 提案された日程をどちらかが承認すると `confirmDate` が呼ばれ、`meeting_schedules.is_commit = true` になる。取り消しは `resetDate`。
3. **クレジット消費**: 日程確定にはクレジット1つが必要（`consumeCredit` → `consume_credit` RPC）。残高0の場合はエラー `INSUFFICIENT_CREDITS` を返し、チャット画面内の「カートに追加」ボタン（`redirectToCheckout`、面談ページに戻ってくるStripe Checkout）または `/dashboard/account`（汎用のクレジット購入ページ）へ誘導する。
4. **ビデオ面談**: 予定日時に、LiveKitのビデオルームで面談を実施。ルーム参加トークンは `/api/livekit-token` が発行するが、**発行条件はサーバー側で強制される**: ①Cookieセッションで認証済み ②その面談の参加者本人（`meetings.user` / `meetings.mentor`）③クレジット消費済み（`meeting_confirmations` が存在）——のすべてを満たす場合のみ（adminは運営監視用に無条件で発行）。トークンのidentityはクエリパラメータではなく認証済みユーザーIDが使われる。`/dashboard/Interview/[meetingId]` ページ側でも同じ条件をUXとして検証し、未払い・日程未確定の場合はチャット画面へ戻す。開始時にLiveKitのwebhook（`/api/webhooks/livekit`）が発火し、面談の録画（Cloudflare R2へ保存）を自動開始する。
5. **終了処理**: 面談後、どちらか一方が `requestFinish`（終了申請）し、**申請していない方**が `approveFinish`（承認）することで `meeting_schedules.is_finished = true` になる（自分の申請は自分で承認できない）。申請の取り消しは `cancelFinishRequest`（申請者本人のみ可能）。
6. 面談が完了すると、その相談は「予定中」から「過去の相談」の一覧に移動する。

### 5.4 レビュー（`/dashboard/review/[meetingId]`）

- 面談を実施した**ユーザー**のみが投稿可能（`meetings.user === 自分のid` であること、かつ同一面談への重複投稿がないことを確認）。
- 評価（星、`reviews.stars`、1〜5）とコメントを入力。
- 投稿と同時に、面談を終了扱いにするAPI（`PATCH /api/meeting/[meetingId]` action: `finish`）を呼び出す。
- `reviews` の増減はDBトリガーで `review_sum`（メンターごとの星の合計・平均・件数・星別カウント）に自動反映される。

### 5.5 クレジット・決済

| 項目 | 内容 |
|---|---|
| 商品 | Stripe固定価格 `price_1TZOHlRbUCCpa1iAiLdVGIRj`、1回の購入で1クレジット付与 |
| 購入経路1 | `/dashboard/account` → `POST /api/checkout_sessions` → Stripe Checkout → 成功時 `/dashboard/success` |
| 購入経路2 | チャット画面内の「カートに追加」ボタン → `redirectToCheckout`（同chat/actions.js） → Stripe Checkout → 成功/キャンセルとも該当の面談チャットへ戻る |
| Webhook | `POST /api/webhooks/stripe`（`checkout.session.completed`）が `users.customer_id` 更新 → `payments` へ記録 → `credit_logs` へ `+1` 記録 |
| 残高反映 | `credit_logs` へのINSERTをトリガーに `credits.balance` が自動更新される（アプリコードは残高を直接書き換えない） |
| 消費 | `consume_credit(p_user_id, p_meeting_id)` RPC。残高が0未満になる消費はDB側で例外 `INSUFFICIENT_CREDITS` を発生させ拒否 |

### 5.6 メンター報酬・振込

| 項目 | 内容 |
|---|---|
| 前提 | メンターはStripe Connect（Expressアカウント）のオンボーディングを完了している必要がある（`/dashboard/mentor/stripe/guide` から `createStripeOnboarding` を実行） |
| 報酬発生 | 面談完了（`meeting_schedules.is_finished = true`）をトリガーに `mentor_balance_logs` へ加算記録 → `mentor_balances.balance` が自動更新（トリガー） |
| 報酬率 | `mentor_secret.transfer_rate`（デフォルト0.70 = 70%）。実際の金額計算はDB関数側で行われる（要確認: 具体的な計算式はマイグレーション履歴上に存在するが本書執筆時点で詳細未検証） |
| 振込手数料 | 固定250円（`PAYOUT_FEE`） |
| 最低振込額 | 1,000円（`MIN_PAYOUT_AMOUNT`） |
| 振込経路1（メンター起点） | `POST /api/mentor/payout` — メンターがダッシュボードから自分の残高を即時振込申請。二重送金防止のため、送金前に `transfers` へ `status='processing'` の行を先行INSERTし、部分ユニークインデックス（`mentor_id WHERE status='processing'`）で並行リクエストを1件に制限（2件目は409）。Stripe送金はこの行のIDをidempotency keyとして実行され、成功で `completed`、失敗で `pending`（再試行可）/`failed` に更新される |
| 振込経路2（自動バッチ） | `POST /api/batch/transfer` — 月次cron（`CRON_SECRET`で認証）。未送金の月をすべて洗い出し、メンターごとに送金。Stripe Connectのオンボーディング未完了のメンターには保留（`pending`）として記録し、口座登録を促すメールを送信 |
| リトライ | Stripeの一時的なエラー（`insufficient_funds`／`rate_limit`／`api_connection_error`）は `pending` として次回に持ち越し、それ以外は `failed` |

### 5.7 メンター審査（管理者機能）

- メンターは `mentors.is_allowed`（自己申告の公開設定、既定 `true`）と `mentor_secret.admin_allow`（運営承認、既定 `false`）の両方が `true` の場合のみ一般公開される。
- 管理者が承認する操作は `POST /api/mentor?id={mentorId}` で `mentors.is_allowed = true` に更新する（内部的には `admin_allow` ではなく `is_allowed` を更新している点に注意。この2フラグの使い分けの意図は要確認）。
- 管理者ダッシュボード (`/dashboard/admin`) では、全ユーザーの相談状況（`meetings`・`meeting_confirmations`・`meeting_schedules` を突き合わせ）を横断的に閲覧できる。

### 5.8 記事・お知らせ（ブログ）

- コンテンツはmicroCMS（外部CMS）で管理し、`/api/article` で取得。
- 一覧: `/articles/[page番号]`、カテゴリ別: `/articles/category/[categoryId]`、詳細: `/articles/id/[articleId]`。
- プレビュー: `/api/draft`（`MICROCMS_PREVIEW_SECRET` で認証、draft modeを有効化）、`/api/exit_draft` で解除。
- microCMS側のWebhook（`/api/revalidate`）でコンテンツ更新時にISRタグを再検証。

---

## 6. 画面一覧

### 公開ページ（`(main)`グループ）

| パス | 内容 |
|---|---|
| `/` | トップページ（サービス紹介・メンター紹介・記事紹介） |
| `/concept` | サービスコンセプト |
| `/mentors` | メンター一覧・検索 |
| `/articles/[page]`, `/articles/category/[id]`, `/articles/id/[id]` | 記事一覧・カテゴリ別・詳細 |
| `/contact` | お問い合わせフォーム |
| `/forCompanies` | 法人向け紹介 |
| `/recruitment` | 採用情報 |
| `/login`, `/signup`, `/signup/user`, `/signup/mentor` | ログイン・サインアップ |
| `/reset` | パスワードリセット申請 |
| `/privacy` | プライバシーポリシー |

### 認証後ページ（`(userPage)`グループ）

| パス | 内容 |
|---|---|
| `/setAccount`, `/setAccount/user(/icon)`, `/setAccount/mentor(/icon)` | オンボーディング |
| `/resetPass` | パスワード再設定 |
| `/dashboard` | ロールに応じて自動振り分け |
| `/dashboard/user` | ユーザーダッシュボード（相談一覧・メンター検索） |
| `/dashboard/mentor` | メンターダッシュボード（相談一覧・報酬） |
| `/dashboard/admin` | 管理者ダッシュボード |
| `/dashboard/account` | アカウント情報・クレジット購入 |
| `/dashboard/booking/[id]` | 相談予約フォーム（`id` はメンターID） |
| `/dashboard/chat/[meetingId]` | チャット・日程調整・面談 |
| `/dashboard/review/[id]` | レビュー投稿（`id` は面談ID） |
| `/dashboard/Interview/[roomName]` | LiveKitビデオ面談画面 |
| `/dashboard/mentor/stripe/guide`, `/refresh`, `/complete` | Stripe Connectオンボーディング導線 |
| `/dashboard/success` | クレジット購入完了 |
| `/dashboard/delete` | アカウント削除 |
| `/dashboard/putComent` | 用途要確認（コメント投稿関連と推測、`comments`テーブルは現在0行で未使用の可能性） |
| `/error` | エラーページ |

### API（`app/api/**`、抜粋は5章参照）

認証系（`auth/callback`, `auth/confirm`, `auth/resetpass`, `auth/signout`, `auth/delete-account`）、決済系（`checkout_sessions`, `webhooks/stripe`）、面談系（`meeting/[meetingId]`, `livekit-token`, `webhooks/livekit`）、記事系（`article`, `draft`, `exit_draft`, `revalidate`, `webhooks/supabase`）、メンター系（`mentor`, `mentor/payout`, `batch/transfer`）、ファイル（`r2_upload`）。

---

## 7. データモデル（主要テーブル）

Supabase (Postgres) 上の `public` スキーマ。すべてRLS有効。

| テーブル | 役割 |
|---|---|
| `profiles` | 全ユーザー共通のロール・オンボーディング状態 |
| `users` | 受験生の詳細情報（名前・学年・志望校・アイコン・Stripe顧客ID） |
| `mentors` | メンターの詳細情報（大学・学部・自己紹介・公開設定・Stripe Connect情報） |
| `mentor_secret` | メンターの機密情報（運営承認フラグ・報酬率） |
| `tags` / `mentor_tags` | 検索用タグとメンターとの中間テーブル |
| `meetings` | 相談（面談）の本体。タイトル・アンケート回答・当事者ID |
| `meeting_schedules` | 面談の日程確定状態・終了状態 |
| `meeting_confirmations` | クレジット消費と面談の紐付け記録 |
| `messages` | チャットメッセージ（通常/日程提案） |
| `comments` | 用途未確認、現在0行 |
| `reviews` / `review_sum` | レビューとメンターごとの集計 |
| `payments` | Stripe決済記録 |
| `credits` / `credit_logs` | ユーザーのクレジット残高とその増減ログ |
| `transfers` | メンターへの振込記録 |
| `mentor_balances` / `mentor_balance_logs` | メンターの報酬残高とその増減ログ |

**設計上の重要な原則**: 残高系（`credits.balance`, `mentor_balances.balance`, `review_sum`）は、アプリケーションコードから直接更新することはなく、必ず対応する `*_logs` テーブルへのINSERT（または `reviews` へのINSERT/DELETE）をトリガーとしてDB側で自動計算される。

---

## 8. 外部連携

| サービス | 用途 |
|---|---|
| Supabase | 認証・Postgres DB・Storage(未使用?要確認) |
| Stripe | クレジット決済、メンター報酬のConnect送金 |
| LiveKit | ビデオ面談・録画（Egress） |
| Cloudflare R2 | アイコン画像・面談録画ファイルの保存（S3互換） |
| Resend | 相談申込・振込案内などのトランザクションメール送信 |
| microCMS | 記事・お知らせのコンテンツ管理 |

---

## 9. バッチ・定期実行処理

- `POST /api/batch/transfer` — メンター報酬の月次自動送金。`CRON_SECRET` で認証。Supabase側の `pg_cron` から呼び出される想定（マイグレーション `setup_pg_cron_monthly_transfer` 参照）。

---

## 10. 既知の課題・要確認事項

本書作成時点のコード監査で判明した、仕様として明文化しづらい・意図が不明瞭な点を記載する（実装バグの修正状況とは別に、仕様理解の観点での注意点）。

1. **`profiles.role` の設定経路が不明**（4章参照）。新規ユーザーがどうやって `pending` から `user`/`mentor` に遷移するのか、アプリコード上に該当処理が見当たらない。
2. **メンター公開フラグが2種類ある**（`mentors.is_allowed` と `mentor_secret.admin_allow`）。管理者承認API (`/api/mentor`) は `is_allowed` を更新するが、公開判定ロジック（5.1節）は両方を要求している。2つのフラグの役割分担の意図が要確認。
3. **報酬率（`transfer_rate`）の実際の計算箇所**は本書では未検証（DB関数内で行われている可能性が高い）。
4. **`comments` テーブルおよび `/dashboard/putComent` 画面**の用途が、現状のコードから明確に特定できなかった。
5. **`updateMentorProfile`（メンタープロフィール編集）の`is_allowed`チェックボックス**は、フォームが何も送信しない場合に常に `true` として保存される実装になっている（意図した挙動か要確認、本書執筆時点では未修正）。
6. **`submitBooking`（相談予約）確認メール**のHTML内に、Supabaseの生オブジェクトがそのまま文字列展開される箇所があり、実際のメール本文に `[object Object]` が出力される（未修正）。

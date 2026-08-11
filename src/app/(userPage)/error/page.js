export default async function ErrorPage({ searchParams }) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-bold mb-3">エラーが発生しました</h1>
        <p className="text-gray-600">
          処理中に問題が発生しました。しばらくしてからもう一度お試しください。
        </p>
        {message && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4 text-left break-words">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

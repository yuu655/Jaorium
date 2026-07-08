async function fetchArticles(apiUrl, apiKey) {
  const res = await fetch(`${apiUrl}blogs`, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
    },
  });
  return res.json();
}

export async function GET() {
  const articles = await fetchArticles(process.env.API_URL, process.env.API_KEY);
  return Response.json(articles);
}

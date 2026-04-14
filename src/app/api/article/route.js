export async function GET() {
    const API_KEY = process.env.API_KEY;
    const API_URL = process.env.API_URL;

    const res = await fetch(`${API_URL}blogs`, {
        headers: {
            "X-MICROCMS-API-KEY": API_KEY
        },
    });

    return Response.json(await res.json());
}

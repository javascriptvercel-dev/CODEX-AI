const getApiBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  return (configured || "http://localhost:4000").replace(/\/+$/, "");
};

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();

  try {
    const upstream = await fetch(`${apiBaseUrl}/api/plugins/${encodeURIComponent(id)}/raw`, {
      cache: "no-store",
      headers: {
        Accept: "text/plain, text/javascript, application/javascript",
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "Plugin not found.");
      return new Response(text || "Plugin not found.", {
        status: upstream.status || 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const body = await upstream.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Frontend plugin raw proxy failed:", error);
    return new Response("Could not load this plugin.", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

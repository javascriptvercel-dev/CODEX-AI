export const dynamic = "force-dynamic";

function backendUrl() {
  const configured =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured
    ? configured.replace(/\/+$/, "")
    : "http://localhost:4000";
}

export async function GET(_request, { params }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9_-]{8}$/.test(code)) {
    return new Response("This short link was not found.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const response = await fetch(
      `${backendUrl()}/api/tools/s/${encodeURIComponent(code)}`,
      { cache: "no-store", redirect: "manual" },
    );

    if (response.status === 302) {
      const destination = response.headers.get("location");
      if (!destination) {
        console.error("[short-links] Backend redirect did not include a destination.");
        return new Response("This short link could not be opened.", {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        });
      }

      let parsed;
      try {
        parsed = new URL(destination);
      } catch {
        console.error("[short-links] Backend returned an invalid redirect destination.");
        return new Response("This short link could not be opened.", {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        console.error("[short-links] Backend returned a disallowed redirect protocol.");
        return new Response("This short link could not be opened.", {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: parsed.toString(),
          "Cache-Control": "no-store",
        },
      });
    }

    if (response.status === 404) {
      return new Response("This short link was not found.", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    console.error(`[short-links] Backend returned status ${response.status}.`);
    return new Response("This short link is temporarily unavailable.", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[short-links] Could not resolve short link:", error);
    return new Response("This short link is temporarily unavailable.", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

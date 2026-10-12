export const dynamic = "force-dynamic";

function getBackendUrl() {
  const configured =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : null;
}

export async function GET() {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    console.error("[stats] Backend API URL is not configured.");
    return Response.json(
      { error: "Statistics are temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/api/stats/public`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[stats] Backend returned status ${response.status}.`);
      return Response.json(
        { error: "Statistics are temporarily unavailable." },
        { status: 502 },
      );
    }

    const data = await response.json();
    if (!Number.isInteger(data?.registeredUsers) || data.registeredUsers < 0) {
      console.error("[stats] Backend returned an invalid user count.");
      return Response.json(
        { error: "Statistics are temporarily unavailable." },
        { status: 502 },
      );
    }

    return Response.json(
      { registeredUsers: data.registeredUsers },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (error) {
    console.error("[stats] Could not fetch the registered user count:", error);
    return Response.json(
      { error: "Statistics are temporarily unavailable." },
      { status: 502 },
    );
  }
}

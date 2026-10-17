import { randomUUID } from "node:crypto";

const TABLE = "deployment_checks";

function getConfiguration() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Add SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel, then redeploy.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new Error("SUPABASE_URL must use HTTPS.");
  }

  return { url, key };
}

function requestHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };

  // Legacy service_role keys are JWTs. New sb_secret keys belong only in apikey.
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function supabaseRequest(url, key, path, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: requestHeaders(key, options.headers),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || body.hint || body.code || "";
    } catch {
      // Avoid returning the upstream response body when it is not JSON.
    }
    throw new Error(`Supabase returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return response;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");
  const startedAt = Date.now();
  const checkId = randomUUID();
  let configuration;
  let inserted = false;

  try {
    configuration = getConfiguration();
    const { url, key } = configuration;

    const insertResponse = await supabaseRequest(url, key, TABLE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ check_id: checkId, source: "vercel-deployment-test" }),
    });
    const insertedRows = await insertResponse.json();
    inserted = insertedRows.some((row) => row.check_id === checkId);

    if (!inserted) {
      throw new Error("Supabase insert did not return the temporary row.");
    }

    const readResponse = await supabaseRequest(
      url,
      key,
      `${TABLE}?check_id=eq.${encodeURIComponent(checkId)}&select=check_id`,
    );
    const rows = await readResponse.json();

    if (rows.length !== 1 || rows[0].check_id !== checkId) {
      throw new Error("Supabase could not read back the temporary row.");
    }

    await supabaseRequest(url, key, `${TABLE}?check_id=eq.${encodeURIComponent(checkId)}`, {
      method: "DELETE",
    });
    inserted = false;

    return response.status(200).json({
      ok: true,
      checkId,
      durationMs: Date.now() - startedAt,
      steps: ["insert", "read", "cleanup"],
    });
  } catch (error) {
    if (inserted && configuration) {
      const { url, key } = configuration;
      try {
        await supabaseRequest(url, key, `${TABLE}?check_id=eq.${encodeURIComponent(checkId)}`, {
          method: "DELETE",
        });
      } catch {
        // Keep the original failure. A timestamp makes any orphaned test row easy to identify.
      }
    }

    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Database check failed.",
    });
  }
}

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, message: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({
    ok: true,
    service: "tabom-deployment-test",
    timestamp: new Date().toISOString(),
    vercel: {
      environment: process.env.VERCEL_ENV || null,
      region: process.env.VERCEL_REGION || null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    },
  });
}

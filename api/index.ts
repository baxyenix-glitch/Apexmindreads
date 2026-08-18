let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      let createServerFn;
      try {
        const bundle = await import("../dist/server/node-build.mjs");
        createServerFn = bundle.createServer;
      } catch {
        const src = await import("../server/index.js");
        createServerFn = src.createServer;
      }
      cachedApp = createServerFn();
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Invocation Crash:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "SERVERLESS_INVOCATION_ERROR",
        message: err?.message || String(err),
        stack: err?.stack || "",
      })
    );
  }
}

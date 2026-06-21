export function withLogger<R extends Request = Request>(
  route: string,
  handler: (req: R, ctx?: unknown) => Promise<Response> | Response
) {
  return async (req: R, ctx?: unknown): Promise<Response> => {
    const start = Date.now();
    try {
      const res = await handler(req, ctx);
      console.log(
        JSON.stringify({
          type: "api",
          route,
          method: req.method,
          status: res.status,
          ms: Date.now() - start,
          ts: new Date().toISOString(),
        })
      );
      return res;
    } catch (err) {
      console.error(
        JSON.stringify({
          type: "api_error",
          route,
          method: req.method,
          ms: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
          ts: new Date().toISOString(),
        })
      );
      throw err;
    }
  };
}

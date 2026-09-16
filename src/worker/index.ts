export interface Env {}

export default {

  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {

    const url =
      new URL(
        request.url
      );

    if (
      url.pathname ===
      "/api/health"
    ) {

      return Response.json({
        ok: true,
        system_id:
          "yamada-stock",
      });

    }

    return new Response(
      "Bytai Worker: yamada-stock"
    );
  },

};

import { Hono } from "https://deno.land/x/hono@v3.2.7/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.2.7/middleware.ts";
import { getSystemStats } from "./util.ts";

const app = new Hono();

app.use("/", serveStatic({ root: "./", index: "index.html" }));

app.get("/api/sys-info", async (c) => {
  try {
    const info = await getSystemStats();
    return c.json(info, 200, {
      "access-control-allow-origin": "*",
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.notFound((c) => c.text("Not Found", 404));

Deno.serve({ port: 8000 }, app.fetch);

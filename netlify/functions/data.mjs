import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("dashboard");
  const headers = { "Content-Type": "application/json" };

  if (req.method === "GET") {
    const state = await store.get("state", { type: "json" });
    return new Response(JSON.stringify(state ?? null), { headers });
  }

  if (req.method === "POST") {
    const pin = (req.headers.get("x-edit-pin") || "").trim();
    const expected = (process.env.EDIT_PIN || "").trim();
    if (!expected || pin !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
    }
    let body;
    try { body = await req.json(); }
    catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers }); }
    await store.setJSON("state", body);
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers });
};

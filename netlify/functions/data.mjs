import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("dashboard");
  const headers = { "Content-Type": "application/json" };
  const url = new URL(req.url);
  
  const action = url.searchParams.get("action");
  const month = url.searchParams.get("month") || "state"; 

  if (req.method === "GET") {
    if (action === "list") {
      const list = await store.list();
      const keys = (list.blobs || []).map(b => b.key);
      return new Response(JSON.stringify({ keys }), { headers });
    }
    const state = await store.get(month, { type: "json" });
    return new Response(JSON.stringify(state ?? null), { headers });
  }

  // Both POST (save) and DELETE (remove) require the secure PIN
  if (req.method === "POST" || req.method === "DELETE") {
    const pin = (req.headers.get("x-edit-pin") || "").trim();
    const expected = (process.env.EDIT_PIN || "").trim();
    if (!expected || pin !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
    }
    
    // Handle deleting a month
    if (req.method === "DELETE") {
      await store.delete(month);
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // Handle saving a month
    if (req.method === "POST") {
      let body;
      try { body = await req.json(); }
      catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers }); }
      
      await store.setJSON(month, body);
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers });
};

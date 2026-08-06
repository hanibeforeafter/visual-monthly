import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("dashboard");
  const headers = { "Content-Type": "application/json" };
  const url = new URL(req.url);
  
  // Check if we are asking for a list of months or a specific month
  const action = url.searchParams.get("action");
  const month = url.searchParams.get("month") || "state"; 

  if (req.method === "GET") {
    // Return a list of all saved months
    if (action === "list") {
      const list = await store.list();
      const keys = (list.blobs || []).map(b => b.key);
      return new Response(JSON.stringify({ keys }), { headers });
    }
    
    // Return data for a specific month
    const state = await store.get(month, { type: "json" });
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
    
    // Save the data under the specific month's name
    await store.setJSON(month, body);
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers });
};

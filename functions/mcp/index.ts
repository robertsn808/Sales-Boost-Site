// MCP (Model Context Protocol) Server — Cloudflare Pages Function
// Exposes CRM data as MCP tools for Claude Desktop, Claude Code, and other MCP clients
// Protocol: JSON-RPC 2.0 over HTTP (Streamable HTTP transport)

interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  ANTHROPIC_API_KEY: string;
  MCP_API_KEY?: string;
}

// ─── MCP Protocol Types ─────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── Tool Definitions ───────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_leads",
    description: "Get all leads in the sales pipeline. Returns lead name, business, status, contact info, and timestamps.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by status: new, contacted, qualified, statement-requested, statement-received, analysis-delivered, proposal-sent, negotiation, won, lost, nurture. Omit for all." },
        limit: { type: "number", description: "Max number of leads to return (default 50)" },
      },
    },
  },
  {
    name: "get_lead",
    description: "Get details for a specific lead by ID.",
    inputSchema: {
      type: "object" as const,
      properties: { id: { type: "string", description: "Lead ID" } },
      required: ["id"],
    },
  },
  {
    name: "create_lead",
    description: "Create a new lead in the sales pipeline.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name" },
        business: { type: "string", description: "Business name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        status: { type: "string", description: "Pipeline status (default: new)" },
        notes: { type: "string", description: "Notes about the lead" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_lead",
    description: "Update an existing lead's information or pipeline status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Lead ID to update" },
        name: { type: "string" }, business: { type: "string" },
        phone: { type: "string" }, email: { type: "string" },
        status: { type: "string" }, notes: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_clients",
    description: "Get all clients. Returns name, business, package, maintenance plan, website status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max number of clients to return (default 50)" },
      },
    },
  },
  {
    name: "list_tasks",
    description: "Get tasks and follow-ups. Can filter by completion status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        completed: { type: "boolean", description: "Filter by completion status. Omit for all." },
        limit: { type: "number", description: "Max number of tasks to return (default 50)" },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a new task or follow-up.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Task description" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
        priority: { type: "string", description: "Priority: high, medium, or low (default: medium)" },
        linkedTo: { type: "string", description: "Business or client name this task is linked to" },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed.",
    inputSchema: {
      type: "object" as const,
      properties: { id: { type: "string", description: "Task ID to complete" } },
      required: ["id"],
    },
  },
  {
    name: "get_revenue",
    description: "Get revenue entries. Shows date, amount, type, and associated client.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max entries to return (default 50)" },
      },
    },
  },
  {
    name: "get_pipeline_summary",
    description: "Get a summary of the entire sales pipeline: counts by status, total active, wins this month, MRR, and revenue this month.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_daily_briefing",
    description: "Get today's action items: overdue tasks, follow-ups due, stale leads, upcoming schedule, and revenue stats. The daily briefing for a sales manager.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function jsonRpc(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}

// ─── Auth ───────────────────────────────────────────────────────────

function authenticate(request: Request, env: Env): boolean {
  // Check for API key in header
  const apiKey = request.headers.get("X-API-Key") || request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!apiKey) return false;

  // Check against MCP_API_KEY env var, or fall back to SESSION_SECRET
  const validKey = env.MCP_API_KEY || env.SESSION_SECRET;
  if (!validKey) return false;

  return apiKey === validKey;
}

// ─── Row Mappers ────────────────────────────────────────────────────

function mapLead(row: Record<string, unknown>) {
  return { id: row.id, name: row.name, business: row.business, phone: row.phone, email: row.email, package: row.package, status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapClient(row: Record<string, unknown>) {
  return { id: row.id, name: row.name, business: row.business, phone: row.phone, email: row.email, package: row.package, maintenance: row.maintenance, websiteUrl: row.website_url, websiteStatus: row.website_status, terminalId: row.terminal_id, monthlyVolume: row.monthly_volume, startDate: row.start_date, notes: row.notes };
}

function mapTask(row: Record<string, unknown>) {
  return { id: row.id, title: row.title, dueDate: row.due_date, priority: row.priority, completed: !!row.completed, linkedTo: row.linked_to, createdAt: row.created_at };
}

function mapRevenue(row: Record<string, unknown>) {
  return { id: row.id, date: row.date, type: row.type, description: row.description, amount: row.amount, clientId: row.client_id, recurring: !!row.recurring };
}

// ─── Tool Handlers ──────────────────────────────────────────────────

async function handleToolCall(db: D1Database, name: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
  switch (name) {
    case "list_leads": {
      const limit = (args.limit as number) || 50;
      let sql = "SELECT * FROM leads";
      const bindings: unknown[] = [];
      if (args.status) { sql += " WHERE status = ?"; bindings.push(args.status); }
      sql += " ORDER BY created_at DESC LIMIT ?";
      bindings.push(limit);
      const { results } = await db.prepare(sql).bind(...bindings).all();
      return { content: [{ type: "text", text: JSON.stringify(results.map(mapLead), null, 2) }] };
    }

    case "get_lead": {
      const row = await db.prepare("SELECT * FROM leads WHERE id = ?").bind(args.id).first();
      if (!row) return { content: [{ type: "text", text: "Lead not found" }] };
      return { content: [{ type: "text", text: JSON.stringify(mapLead(row), null, 2) }] };
    }

    case "create_lead": {
      const id = genId();
      const ts = new Date().toISOString();
      await db.prepare(
        "INSERT INTO leads (id, name, business, phone, email, package, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, args.name || "", args.business || "", args.phone || "", args.email || "", "terminal", args.status || "new", args.notes || "", ts, ts).run();
      const row = await db.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
      return { content: [{ type: "text", text: `Lead created:\n${JSON.stringify(mapLead(row!), null, 2)}` }] };
    }

    case "update_lead": {
      const updates: string[] = [];
      const values: unknown[] = [];
      for (const key of ["name", "business", "phone", "email", "status", "notes"]) {
        if (args[key] !== undefined) { updates.push(`${key} = ?`); values.push(args[key]); }
      }
      updates.push("updated_at = ?"); values.push(new Date().toISOString());
      if (updates.length > 1) {
        await db.prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`).bind(...values, args.id).run();
      }
      const row = await db.prepare("SELECT * FROM leads WHERE id = ?").bind(args.id).first();
      if (!row) return { content: [{ type: "text", text: "Lead not found" }] };
      return { content: [{ type: "text", text: `Lead updated:\n${JSON.stringify(mapLead(row), null, 2)}` }] };
    }

    case "list_clients": {
      const limit = (args.limit as number) || 50;
      const { results } = await db.prepare("SELECT * FROM clients ORDER BY business ASC LIMIT ?").bind(limit).all();
      return { content: [{ type: "text", text: JSON.stringify(results.map(mapClient), null, 2) }] };
    }

    case "list_tasks": {
      const limit = (args.limit as number) || 50;
      let sql = "SELECT * FROM tasks";
      const bindings: unknown[] = [];
      if (args.completed !== undefined) { sql += " WHERE completed = ?"; bindings.push(args.completed ? 1 : 0); }
      sql += " ORDER BY completed ASC, priority ASC, due_date ASC LIMIT ?";
      bindings.push(limit);
      const { results } = await db.prepare(sql).bind(...bindings).all();
      return { content: [{ type: "text", text: JSON.stringify(results.map(mapTask), null, 2) }] };
    }

    case "create_task": {
      const id = genId();
      await db.prepare(
        "INSERT INTO tasks (id, title, due_date, priority, completed, linked_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, args.title || "", args.dueDate || "", args.priority || "medium", 0, args.linkedTo || "", new Date().toISOString()).run();
      const row = await db.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
      return { content: [{ type: "text", text: `Task created:\n${JSON.stringify(mapTask(row!), null, 2)}` }] };
    }

    case "complete_task": {
      await db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").bind(args.id).run();
      const row = await db.prepare("SELECT * FROM tasks WHERE id = ?").bind(args.id).first();
      if (!row) return { content: [{ type: "text", text: "Task not found" }] };
      return { content: [{ type: "text", text: `Task completed: ${row.title}` }] };
    }

    case "get_revenue": {
      const limit = (args.limit as number) || 50;
      const { results } = await db.prepare("SELECT * FROM revenue ORDER BY date DESC LIMIT ?").bind(limit).all();
      return { content: [{ type: "text", text: JSON.stringify(results.map(mapRevenue), null, 2) }] };
    }

    case "get_pipeline_summary": {
      const { results: leads } = await db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();
      const { results: clients } = await db.prepare("SELECT maintenance, COUNT(*) as count FROM clients GROUP BY maintenance").all();

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { results: monthRev } = await db.prepare("SELECT SUM(amount) as total FROM revenue WHERE date >= ?").bind(monthStart).all();

      const mrrPrices: Record<string, number> = { none: 0, basic: 50, pro: 199, premium: 399 };
      const mrr = clients.reduce((sum, c) => sum + (mrrPrices[c.maintenance as string] || 0) * (c.count as number), 0);

      const statusCounts = Object.fromEntries(leads.map(l => [l.status, l.count]));
      const activeStatuses = ["new", "contacted", "qualified", "statement-requested", "statement-received", "analysis-delivered", "proposal-sent", "negotiation"];
      const totalActive = activeStatuses.reduce((s, st) => s + ((statusCounts[st] as number) || 0), 0);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            pipeline: statusCounts,
            totalActive,
            totalClients: clients.reduce((s, c) => s + (c.count as number), 0),
            mrr,
            revenueThisMonth: (monthRev[0]?.total as number) || 0,
          }, null, 2),
        }],
      };
    }

    case "get_daily_briefing": {
      const todayStr = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

      const { results: overdueTasks } = await db.prepare(
        "SELECT * FROM tasks WHERE completed = 0 AND due_date < ? AND due_date != ''"
      ).bind(todayStr).all();

      const { results: todayTasks } = await db.prepare(
        "SELECT * FROM tasks WHERE completed = 0 AND due_date = ?"
      ).bind(todayStr).all();

      const { results: staleLeads } = await db.prepare(
        "SELECT * FROM leads WHERE status NOT IN ('won', 'lost', 'nurture') AND updated_at < ?"
      ).bind(sevenDaysAgo + "T00:00:00.000Z").all();

      const { results: allLeads } = await db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();
      const statusCounts = Object.fromEntries(allLeads.map(l => [l.status, l.count]));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            date: todayStr,
            overdueTasks: overdueTasks.map(mapTask),
            todayTasks: todayTasks.map(mapTask),
            staleLeads: staleLeads.map(mapLead),
            pipelineSummary: statusCounts,
          }, null, 2),
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}

// ─── Main MCP Handler ───────────────────────────────────────────────

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const method = request.method;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  // GET /mcp — info endpoint
  if (method === "GET") {
    return respond({
      name: "techsavvy-crm",
      version: "1.0.0",
      description: "TechSavvy CRM MCP Server — manage leads, clients, tasks, and revenue via AI tools",
      protocol: "mcp",
      transport: "streamable-http",
      authentication: "Bearer token or X-API-Key header required",
      tools: TOOLS.map(t => t.name),
    });
  }

  // POST /mcp — JSON-RPC handler
  if (method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  // Authenticate
  if (!authenticate(request, env)) {
    return respond(jsonRpcError(null, -32000, "Unauthorized — provide X-API-Key or Authorization: Bearer <key>"), 401);
  }

  let body: JsonRpcRequest;
  try {
    body = await request.json() as JsonRpcRequest;
  } catch {
    return respond(jsonRpcError(null, -32700, "Parse error"), 400);
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return respond(jsonRpcError(body.id ?? null, -32600, "Invalid JSON-RPC request"), 400);
  }

  const id = body.id ?? null;

  try {
    switch (body.method) {
      // ─── initialize ─────────────────────────────────────────────
      case "initialize": {
        return respond(jsonRpc(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: "techsavvy-crm",
            version: "1.0.0",
          },
        }));
      }

      // ─── notifications/initialized ──────────────────────────────
      case "notifications/initialized": {
        // Notification, no response needed but we respond anyway for HTTP
        return respond(jsonRpc(id, {}));
      }

      // ─── tools/list ─────────────────────────────────────────────
      case "tools/list": {
        return respond(jsonRpc(id, { tools: TOOLS }));
      }

      // ─── tools/call ─────────────────────────────────────────────
      case "tools/call": {
        const params = body.params as { name: string; arguments?: Record<string, unknown> } | undefined;
        if (!params?.name) {
          return respond(jsonRpcError(id, -32602, "Missing tool name"));
        }

        const tool = TOOLS.find(t => t.name === params.name);
        if (!tool) {
          return respond(jsonRpcError(id, -32602, `Unknown tool: ${params.name}`));
        }

        const result = await handleToolCall(env.DB, params.name, params.arguments || {});
        return respond(jsonRpc(id, result));
      }

      // ─── ping ───────────────────────────────────────────────────
      case "ping": {
        return respond(jsonRpc(id, {}));
      }

      default:
        return respond(jsonRpcError(id, -32601, `Method not found: ${body.method}`));
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("MCP error:", message);
    return respond(jsonRpcError(id, -32603, message), 500);
  }
};

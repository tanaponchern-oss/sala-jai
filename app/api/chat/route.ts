import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { allowRequest } from "@/lib/rateLimit";
import { looksAtRisk } from "@/lib/safety";
import { MONK } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_CHARS = 2000;
const MAX_TURNS = 40;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) return null;
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_CHARS);
    if (!text) return null;
    out.push({ role, content: text });
  }
  // Must alternate and start and end on the user.
  if (out[0].role !== "user" || out[out.length - 1].role !== "user") return null;
  for (let i = 1; i < out.length; i++) if (out[i].role === out[i - 1].role) return null;
  return out;
}

const plain = (text: string, status: number) =>
  new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allowRequest(ip)) {
    return plain("ตอนนี้มีการส่งข้อความถี่เกินไป พักสักครู่แล้วลองใหม่นะ", 429);
  }

  let messages: ChatMessage[] | null = null;
  try {
    messages = parseMessages(await req.json());
  } catch {
    messages = null;
  }
  if (!messages) return plain("ข้อความไม่ถูกต้อง ลองส่งใหม่อีกครั้ง", 400);

  const atRisk = messages.some((m) => m.role === "user" && looksAtRisk(m.content));
  // Conversations are not stored or logged anywhere: they live only in the visitor's browser.
  const system = atRisk
    ? `${SYSTEM_PROMPT}\n\nหมายเหตุจากระบบ: ข้อความของผู้ใช้มีสัญญาณความเสี่ยงที่จะทำร้ายตัวเอง ให้ปฏิบัติตามข้อความปลอดภัยข้างต้นเป็นอันดับแรก`
    : SYSTEM_PROMPT;

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        const stream = getClient().beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 4000,
            system,
            messages,
            output_config: { effort: "low" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          },
          { signal: req.signal },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            sent = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !sent) {
          controller.enqueue(encoder.encode(
            `ขอโทษนะ เพื่อนธรรมตอบเรื่องนี้ไม่ได้ ถ้าอยากคุยเรื่องนี้ต่อ โทรหา${MONK.name} ได้ที่ ${MONK.phoneDisplay}`,
          ));
        }
      } catch (err) {
        if (!sent) {
          const msg = err instanceof Anthropic.RateLimitError
            ? "ตอนนี้มีผู้คุยอยู่มาก รอสักครู่แล้วลองส่งอีกครั้งนะ"
            : "ส่งข้อความไม่สำเร็จ ลองส่งอีกครั้งได้เลย";
          controller.enqueue(encoder.encode(msg));
        }
        // Log only the error kind, never the conversation.
        console.error("chat error", err instanceof Anthropic.APIError ? err.status : (err as Error)?.name);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Risk": atRisk ? "1" : "0",
    },
  });
}

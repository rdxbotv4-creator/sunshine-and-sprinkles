import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server.ts";
import { OWNER, authors, categories, channel, collections, novels } from "@/lib/catalog";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

let cachedInstructions: string | null = null;

function buildInstructions() {
  if (cachedInstructions) return cachedInstructions;
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const lines = novels.map((n) => {
    const cats = n.cats.map((c) => catName.get(c) ?? c).join(", ");
    const kind = n.format === "series" ? `series, ${n.eps.length} episodes` : "complete in one video";
    return `- ${n.name}${n.urdu ? ` (${n.urdu})` : ""} | by ${n.author ?? "unknown"} | ${cats} | ${kind} | ${n.views} views | /novels/${n.slug}`;
  });
  cachedInstructions = `You are "Kitab", the friendly librarian of the Novels Forever website — a library of Urdu audio novels from the YouTube channel ${channel.name} (${channel.url}).
Answer in the same language and script the visitor uses (Roman Urdu, Urdu or English). Keep answers short, warm and helpful.
Only recommend novels from the catalog below. When you mention a novel, link it as a markdown link to its page path, e.g. [Man Yaram](/novels/man-yaram). Never invent novels, authors or episodes.
If asked for a PDF: the novel page has a "Find PDF" button (Google search) and, when the owner has uploaded one, Read and Download buttons. The PDF Library page is /pdfs.
Support: owner ${OWNER.name}, WhatsApp ${OWNER.whatsappDisplay} (https://wa.me/${OWNER.whatsapp}). Contact page: /contact.
Site pages: /novels (all novels by category, search), /authors, /playlists, /pdfs, /contact.

Categories: ${categories.map((c) => `${c.name} (${c.count})`).join("; ")}
Authors with most novels: ${authors
    .slice(0, 40)
    .map((a) => `${a.name} (${a.novels.length}) /authors/${a.slug}`)
    .join("; ")}
Playlists: ${collections.map((c) => `${c.title} (${c.count})`).join("; ")}

CATALOG (${novels.length} novels):
${lines.join("\n")}`;
  return cachedInstructions;
}

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(60),
});

export async function handleChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });

  let messages: UIMessage[];
  try {
    const parsed = bodySchema.parse(await request.json());
    messages = parsed.messages as UIMessage[];
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: buildInstructions(),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (error) => {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 429) return "Too many questions right now. Please wait a moment and try again.";
        if (status === 402) return "The library assistant is resting (AI credits used up). Please try later.";
        console.error("chat error", error);
        return "Sorry, something went wrong. Please try again.";
      },
    }),
    runIdFetch,
  );
}

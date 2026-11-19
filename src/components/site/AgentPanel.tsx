import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const SUGGESTIONS = [
  "Suggest a rude hero romantic novel",
  "Anna Ilyas ke best novels konse hain?",
  "Best complete novel for tonight?",
  "Cousin marriage novels batao",
];

/** Fresh conversation every visit: nothing is saved. */
export default function AgentPanel({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (err) => toast.error(err.message || "The librarian could not answer. Try again."),
  });
  const formRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready") formRef.current?.querySelector("textarea")?.focus();
  }, [status]);

  const submit = (m: PromptInputMessage) => {
    const text = m.text.trim();
    if (!text || busy) return;
    void sendMessage({ text });
  };

  return (
    <div className="bg-card-grad gold-frame fixed bottom-4 right-4 z-50 flex h-[min(640px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl shadow-glow">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src={logo} alt="" className="h-10 w-10" />
        <div className="flex-1">
          <p className="font-display text-xl leading-none text-gold">Kitab · Librarian</p>
          <p className="mt-1 text-xs text-muted-foreground">Knows all novels on this website</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close chat" onClick={onClose}>
          <X />
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="gap-5">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="mt-2 flex flex-col items-center gap-3">
                <img src={logo} alt="" className="animate-float h-16 w-16" />
                <p className="font-display text-2xl text-gold">Assalam o Alaikum!</p>
                <p className="text-center text-sm text-muted-foreground">
                  Ask me about any novel, writer or category.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage({ text: s })}
                      className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse
                          key={i}
                          className="[&_a]:text-primary [&_a]:underline"
                          isAnimating={status === "streaming"}
                        >
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <p key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      )
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Turning the pages…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div ref={formRef} className="border-t border-border p-3">
        <PromptInput onSubmit={submit}>
          <PromptInputTextarea placeholder="Koi novel suggest karo…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

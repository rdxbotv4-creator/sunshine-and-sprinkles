import { Suspense, lazy, useState } from "react";
import { MessageSquareText } from "lucide-react";
import logo from "@/assets/logo.png";

const AgentPanel = lazy(() => import("./AgentPanel"));

export function AgentLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <Suspense fallback={null}>
          <AgentPanel onClose={() => setOpen(false)} />
        </Suspense>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-5 right-5 z-50 flex cursor-pointer items-center gap-2 rounded-full border border-primary/40 bg-card py-2 pl-2 pr-4 shadow-glow transition-transform hover:-translate-y-1"
          aria-label="Ask the AI librarian"
        >
          <img src={logo} alt="" className="h-10 w-10 transition-transform group-hover:rotate-[-8deg]" />
          <span className="hidden text-sm font-medium text-primary sm:inline">Ask the librarian</span>
          <MessageSquareText className="h-4 w-4 text-primary sm:hidden" />
        </button>
      )}
    </>
  );
}

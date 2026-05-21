import { Suspense } from "react";
import ChatLandingPageClient from "./ChatLandingPageClient";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading chat...</div>}>
      <ChatLandingPageClient />
    </Suspense>
  );
}

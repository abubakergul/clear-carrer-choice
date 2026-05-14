import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";

export default async function ChatPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return <ChatInterface />;
}

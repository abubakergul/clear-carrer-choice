import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ChatInterface from "@/components/chat/ChatInterface";

export default async function ChatPage() {
  const session = await auth();

  if (session?.user?.id) {
    const insight = await prisma.fitInsight.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    // Logged-in user who already has an insight goes to dashboard
    // (will redirect to /home once that page exists)
    if (insight) redirect("/dashboard");
    // Logged-in user without insight: fall through and allow chat
  }

  return <ChatInterface />;
}

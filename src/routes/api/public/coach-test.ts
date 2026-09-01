import { createFileRoute } from "@tanstack/react-router";
import { coachChat } from "@/lib/coach-chat.functions";

// TEMPORAL — verificación del chat del coach. Se elimina tras la prueba.
export const Route = createFileRoute("/api/public/coach-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        const res = await coachChat({ data: body });
        return new Response(JSON.stringify(res), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

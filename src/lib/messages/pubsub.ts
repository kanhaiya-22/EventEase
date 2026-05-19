type MessageEvent = {
  type: "message:new" | "message:read";
  conversationId: string;
  payload: unknown;
};

type Handler = (event: MessageEvent) => void;

const globalRef = globalThis as unknown as {
  __eventeaseMsgSubs?: Map<string, Set<Handler>>;
};

function getSubscribers(): Map<string, Set<Handler>> {
  if (!globalRef.__eventeaseMsgSubs) {
    globalRef.__eventeaseMsgSubs = new Map();
  }
  return globalRef.__eventeaseMsgSubs;
}

export function subscribeUser(userId: string, handler: Handler): () => void {
  const subs = getSubscribers();
  if (!subs.has(userId)) subs.set(userId, new Set());
  subs.get(userId)!.add(handler);
  return () => {
    const set = subs.get(userId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) subs.delete(userId);
  };
}

export function publishToUser(userId: string, event: MessageEvent): void {
  const set = getSubscribers().get(userId);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(event);
    } catch (err) {
      console.error("[messages/pubsub] handler error:", err);
    }
  }
}

export type { MessageEvent };

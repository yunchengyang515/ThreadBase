import { WebClient } from "@slack/web-api";

export const getMessage = async ({
  messageTs,
  channelId,
  senderId,
  isReply,
  client,
}: {
  messageTs: string;
  channelId: string;
  senderId: string;
  isReply: boolean;
  client: WebClient;
}) => {
  let result;

  if (!isReply) {
    result = await client.conversations.history({
      channel: channelId,
      latest: messageTs,
      limit: 1,
      user: senderId,
      inclusive: true,
    });
  } else {
    result = await client.conversations.replies({
      channel: channelId,
      ts: messageTs,
      limit: 1,
      user: senderId,
      inclusive: true,
    });
  }

  return result.messages && result.messages[0] ? result.messages[0] : null;
};

export const getPermalinkWithTimeout = async (
  client: WebClient,
  channelId: string,
  messageTs: string,
  ms = 1000,
) => {
  const timeout = (ms: number) => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Promise timed out after " + ms + " milliseconds."));
      }, ms);
    });
  };
  try {
    const result = await Promise.race([
      client.chat.getPermalink({
        channel: channelId,
        message_ts: messageTs,
      }),
      timeout(ms),
    ]);

    return (result as { permalink: string }).permalink;
  } catch (error) {
    console.warn("Error fetching thread permalink:", (error as any).message);
    return undefined;
  }
};

import { App, BlockAction, ButtonAction } from "@slack/bolt";
import { previewButtonActionId } from "./constants";
import { createPreviewModal } from "./views";
import { getMessagesFormThread } from "./utils";

export const previewButtonHandler = (app: App) => {
  app.action(previewButtonActionId, async ({ ack, body, client }) => {
    try {
      await ack();
      const payload = body as BlockAction;
      const action = payload.actions[0] as ButtonAction;
      const threadId = action.value;
      try {
        const messages = await getMessagesFormThread({ threadId, client });
        if (!messages.length) {
          throw new Error("Invalid number of messages");
        }
        const message = messages[0];

        const previewModal = createPreviewModal(message);
        await client.views.open({
          trigger_id: payload.trigger_id,
          view: previewModal,
        });
      } catch (error) {
        console.error(JSON.stringify(error));
        const errorMessage = `*Unable to preview message.* 
Please ensure:
• The *ThreadBase* app is added to the channel.
• The message has not been deleted.
• Private messages are *not* supported yet.`;
        const previewModal = createPreviewModal({ text: errorMessage }, "error");
        await client.views.open({
          trigger_id: payload.trigger_id,
          view: previewModal,
        });
      }
    } catch (error) {
      console.error(JSON.stringify(error));
    }
  });
};

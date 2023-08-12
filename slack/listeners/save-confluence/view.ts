import { View } from "@slack/bolt";

export const confluenceAuthView = async (authorizeUrl: string): Promise<View> => {

    return{
        "type": "modal",
        "title": {
            "type": "plain_text",
            "text": "Confluence Integration",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Link your account with Confluence"
                },
                "accessory": {
                    "type": "button",
                    style: "primary",
                    "text": {
                        "type": "plain_text",
                        "text": "Link Now",
                        "emoji": true
                    },
                    "value": "create_confluence",
                    "url": authorizeUrl,
                    "action_id": "authorize_confluence"
                }
            }
        ]
    }
}
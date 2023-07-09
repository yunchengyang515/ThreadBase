import { ActionsBlock, Button, View } from "@slack/bolt";
import { ISavedThread, threadRepo } from "../../module/thread";
import { teamSelector } from "./teams/views";
import { savedThreadsViews } from "./chats";
import { ISavedTeam } from "../../module/team";

import { WebClient } from "@slack/web-api"
import { getLatestTeamIdForUser } from "../../module/userUI";
import { createTeamButtonActionId, editTeamButtonActionId, personalSpaceValue } from "./teams/constants";
import { checkIfUserIsTeamOwner, getTeamsForUser } from "./teams/utils";
import { searchButton } from "./search/views";

const homeViewBase: View = {
    type: "home",
    callback_id: "home_view",
    blocks: []
}


export const homeTabActionRow = ({selectedTeamId, isOwner, hasThreads=false}:{selectedTeamId?: string, isOwner?:boolean, hasThreads:boolean}): ActionsBlock => {
    const elements: Button[] = [
        {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Create New Team",
                "emoji": true
            },
            "value": "create_team",
            "action_id": createTeamButtonActionId
        }
    ];

    if (selectedTeamId && selectedTeamId !== personalSpaceValue && isOwner) {
        elements.push({
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Edit Current Team",
                "emoji": true
            },
            "value": selectedTeamId,
            "action_id": editTeamButtonActionId
        });
    }

    if (hasThreads) {
        elements.push(searchButton);
    }

    return {
        "type": "actions",
        "elements": elements
    }
}


export const threadsView = ({ threads, teams, selectedTeamId, isOwner = false }:{threads: ISavedThread[], teams: ISavedTeam[], selectedTeamId?: string, isOwner?: boolean}): View => {
    let headerText: string;
    let additionalBlocks: any[];

    if (threads.length === 0) {
        headerText = "Looks like there is no chat saved in this space yet👆";
        additionalBlocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Use the *Save The Message* message shortcut to start organise chats with summaries, keywords, and descriptions. It's like a treasure map for your future self to find chats easily! 😎\nSimply hover over the message you want to save, click on the 'More actions' icon (it looks like three vertical dots), and choose 'Save The Chat'.`
                }
            }
        ];
    } else {
        headerText = "Here's your saved chats :speech_balloon:";
        additionalBlocks = savedThreadsViews(threads);
    }   

    const hasThreads = threads.length > 0;

    const blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": headerText
            }
        },
        homeTabActionRow({selectedTeamId, isOwner, hasThreads}),
        teamSelector(teams, selectedTeamId),
        {
            "type": "divider"
        },
    ]

    blocks.push(...additionalBlocks)

    return {
        ...homeViewBase,
        ...{
            "type": "home",
            "blocks": blocks,
        }
    }
}
    

export const getSavedThreadViewByUser = async (orgId:string, userId:string, selectedTeamId?:string) =>{
    const teams = await getTeamsForUser(orgId, userId);
    const userLatestTeamId = await getLatestTeamIdForUser(orgId, userId);
    const displayTeamId = selectedTeamId || userLatestTeamId;
    let threads: ISavedThread[];
    if(!displayTeamId || selectedTeamId === personalSpaceValue) {
        threads = await threadRepo.getPersonalSavedThreadForUser(orgId, userId)
    } else {
        threads = await threadRepo.getSavedThreadForTeam(displayTeamId)
    }
    let isOwner = false;

    if(displayTeamId && displayTeamId !== personalSpaceValue) {
        isOwner = await checkIfUserIsTeamOwner({orgId, userId, teamId: displayTeamId})
    }

    return threadsView({threads, teams, selectedTeamId: displayTeamId, isOwner});
}


export const getUserHomeView = async (orgId:string, userId: string, client: WebClient, selectedTeamId?: string) => {
    const updatedHomeView = await getSavedThreadViewByUser(orgId,userId, selectedTeamId);
    client.views.publish({
        user_id: userId,
        view: updatedHomeView,
    })
}
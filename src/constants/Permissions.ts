import { Policy } from "../generated/prisma/client";

export const Action = {

    GET_ORGANIZATIONS: 'GET_ORGANIZATIONS',

    UPDATE_ORG: "UPDATE_ORG",
    DELETE_ORG: "DELETE_ORG",

    CREATE_USER: "CREATE_USER",
    ADD_MEMBER: "ADD_MEMBER",
    REMOVE_MEMBER: "REMOVE_MEMBER",
    CHANGE_MEMBER_ROLE: 'CHANGE_MEMBER_ROLE',
    GET_MEMBERS_LIST: "GET_MEMBERS_LIST",

    GET_PROJECTS: "GET_PROJECTS",
    CREATE_PROJECT: "CREATE_PROJECT",
    UPDATE_PROJECT_MEMBER_ROLE: 'UPDATE_PROJECT_MEMBER_ROLE',
    GET_PROJECT: "GET_PROJECT",
    VIEW_PROJECT: "VIEW_PROJECT",
    UPDATE_PROJECT: "UPDATE_PROJECT",
    PROJECT_MEMBERS_LIST: "PROJECT_MEMBERS_LIST",
    ADD_PROJECT_MEMBER: "ADD_PROJECT_MEMBER",
    REMOVE_PROJECT_MEMBER: "REMOVE_PROJECT_MEMBER",
    DELETE_PROJECT: "DELETE_PROJECT",

    GET_TEAMS: "GET_TEAMS",
    GET_PROJECT_TEAMS: "GET_PROJECT_TEAMS",
    GET_TEAM_MEMBERS: "GET_TEAM_MEMBERS",
    VIEW_TEAM: "VIEW_TEAM",
    CREATE_TEAM: "CREATE_TEAM",
    DELETE_TEAM: "DELETE_TEAM",

    ADD_TEAM_MEMBER: "ADD_TEAM_MEMBER",
    REMOVE_TEAM_MEMBER: "REMOVE_TEAM_MEMBER",
    CREATE_WORKFLOW: "CREATE_WORKFLOW",
    CREATE_TASK: "CREATE_TASK",
    ASSIGN_TASK: "ASSIGN_TASK",
} as const

export type Action = typeof Action[keyof typeof Action]


export const permissionMap: Record<string, string[]> = {
    SUPER_ADMIN_ACTIONS: ["GET_ORGANIZATIONS"],
    ORG_OWNER_ACTIONS: ["DELETE_ORG", "UPDATE_ORG"],
    ORG_ADMIN_ACTIONS: [
        "CREATE_USER",
        "ADD_MEMBER",
        "REMOVE_MEMBER",
        "CHANGE_MEMBER_ROLE",
        "CREATE_PROJECT",
        "GET_MEMBERS_LIST",
        "DELETE_PROJECT",
        "GET_PROJECTS",
        "GET_TEAMS",
    ],
    PROJECT_ADMIN_ACTIONS: [
        "PROJECT_MEMBERS_LIST",
        "UPDATE_PROJECT",
        "GET_PROJECT",
        "ADD_PROJECT_MEMBER",
        "REMOVE_PROJECT_MEMBER",
        "UPDATE_PROJECT_MEMBER_ROLE",
        "GET_PROJECT_TEAMS",
        "CREATE_TEAM",
        "DELETE_TEAMS",
        "CREATE_WORKFLOW",

        "ASSIGN_TASK"
    ],
    PROJECT_MEMBER_ACTIONS: [
        "VIEW_PROJECT",
    ],
    TEAM_ADMIN_ACTIONS: [
        "ADD_TEAM_MEMBER",
        "GET_TEAM_MEMBERS",
        "REMOVE_TEAM_MEMBER",
        "CREATE_TASK",
        "ASSIGN_TASK",
    ],
    TEAM_MEMBER_ACTIONS: ["CREATE_TASK", "VIEW_TEAM"],
};


export const Resources = {
    ORGANIZATION: 'ORGANIZATION',
    PROJECT: 'PROJECT',
    TEAM: 'TEAM'
} as const
export type Resources = typeof Resources[keyof typeof Resources]







export const getActionsPerPolicy = (policies: Policy[]) => {
    return policies.map((policy) => {
        const actions = new Set<string>();

        if (policy.effect === "ALLOW") {
            policy.permissions.forEach((permission: string) => {
                const mappedActions = permissionMap[permission] || [];
                mappedActions.forEach((a) => actions.add(a));
            });
        }

        return {
            ...policy,
            actions: Array.from(actions),
        };
    });
}




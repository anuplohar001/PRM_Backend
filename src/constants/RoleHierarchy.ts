export const GlobalRoleHierarchy = {
    SUPER_ADMIN: 100,
    ORG_OWNER: 80,
    ORG_ADMIN: 70,
    PROJECT_ADMIN: 60,
    ORG_MEMBER: 40,
    PROJECT_MEMBER: 30,
    USER: 10
} as const

export type Role = keyof typeof GlobalRoleHierarchy
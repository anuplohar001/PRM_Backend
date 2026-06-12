export const userBasicSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
};

export const userHoverCardSelect = {
    ...userBasicSelect,

    teamMemberships: {
        select: {
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },

    projectMemberships: {
        select: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
};
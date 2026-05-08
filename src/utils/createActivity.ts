import { ActionType, EntityType } from "../generated/prisma/enums";
import { prisma } from "./prisma";


interface CreateActivityParams {
    actorId: number;
    action: ActionType;
    module?: string;
    entityId: number;
    entityType: EntityType;
    projectId?: number;
    projectTitle?: string;
    isAdmin: boolean;
    assignedTo?: number | null;
    adminIds?: number[];
    visibilityUserIds?: number[];
    metadata?: Record<string, any>;
}

export const createActivity = async ({
    actorId,
    action,
    module = "task",
    entityId,
    entityType = "TASK",
    projectId,
    projectTitle,
    isAdmin,
    assignedTo,
    adminIds = [],
    visibilityUserIds = [],
    metadata = {},
}: CreateActivityParams): Promise<void> => {
    let visibleUserIds: number[] = [];

    if (visibilityUserIds) {
        visibleUserIds = visibilityUserIds;
    } else {
        if (!isAdmin) {
            visibleUserIds = adminIds || [];
        }

        if (isAdmin) {
            visibleUserIds = [...(adminIds || [])];

            if (assignedTo && assignedTo !== actorId) {
                visibleUserIds.push(assignedTo);
            }
        }
    }

    visibleUserIds = Array.from(new Set(visibleUserIds));

    await prisma.activity.create({
        data: {
            actorId,
            action,
            module,
            entityId,
            entityType,
            projectId,
            visibilityType: "CUSTOM",
            metadata: {
                projectTitle,
                assignedTo,
                ...metadata,
            },
            visibilityUsers: {
                create: visibleUserIds.map((id) => ({
                    userId: id,
                })),
            },
        },
    });
};
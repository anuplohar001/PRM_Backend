import { redisSubscriber } from "./redis"

export const startInventorySubscriber =
    async () => {
        await redisSubscriber.subscribe(
            "activity:created",
            async (message) => {
                try {
                    const activity =
                        typeof message === "string"
                            ? JSON.parse(message)
                            : message

                    console.log(
                        "Activity Received:",
                        activity
                    )
                } catch (error) {
                    console.error(
                        "Failed to parse activity:",
                        error
                    )
                }
            }
        )

        redisSubscriber.on(
            "message",
            (channel, message) => {
                if (channel === "activity:created") {
                    const activity = JSON.parse(message)

                    console.log(activity)
                }
            }
        )
    }
import express from "express";
import {
    createTask,
    updateTask,
    deleteTask,
    getTasks,
} from "../controllers/tasks.controllers";
import { authenticateUser } from "../middlewares/auth.middleware";

const taskRoutes = express.Router();

taskRoutes.get("/:projectId", authenticateUser, getTasks);
taskRoutes.post("/create", authenticateUser, createTask);
taskRoutes.put("/update/:taskId", authenticateUser, updateTask);
taskRoutes.delete("/delete/:taskId", authenticateUser, deleteTask);

export default taskRoutes;
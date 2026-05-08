import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import { getActivities } from "../controllers/activity.controllers";

const activityRoutes = express.Router();

activityRoutes.get("/", authenticateUser, getActivities);

export default activityRoutes;
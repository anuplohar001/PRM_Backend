import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { createWorkflow } from '../controllers/workflow.controllers'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    // requireProjRole("PROJECT_ADMIN"),
    createWorkflow
)

export default router
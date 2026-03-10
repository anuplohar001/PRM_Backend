import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { requireProjRole } from '../middlewares/permission.middleware'
import { createWorkflow } from '../controllers/workflow.controllers'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    createWorkflow
)
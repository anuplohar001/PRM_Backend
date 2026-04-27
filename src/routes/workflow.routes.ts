import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { createWorkflow, deleteWorkflow, getProjectWorkflow, getWorkflow, updateWorkflow } from '../controllers/workflow.controllers'
import { checkProjectPermissions } from '../middlewares/permission.middleware'
import { Action } from '../constants/Permissions'

const router = express.Router()


router.get(
    '/:projectId',
    authenticateUser,
    getProjectWorkflow
)
router.get(
    '/get-workflow/:workflowId',
    authenticateUser,
    getWorkflow
)

router.delete(
    '/:projectId/:workflowId',
    authenticateUser,
    checkProjectPermissions(Action.CREATE_WORKFLOW),
    deleteWorkflow
)



router.post(
    "/create",
    authenticateUser,
    checkProjectPermissions(Action.CREATE_WORKFLOW),
    createWorkflow
)



router.put(
    "/update",
    authenticateUser,
    checkProjectPermissions(Action.CREATE_WORKFLOW),
    updateWorkflow
)
export default router
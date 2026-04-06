import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getRecords, getSystemOverview } from '../controllers/getRecords.controllers'

const router = express.Router()

router.post(
    "/getRecords",
    authenticateUser,
    getRecords
)

router.get(
    "/system-data",
    authenticateUser,
    getSystemOverview
)

export default router
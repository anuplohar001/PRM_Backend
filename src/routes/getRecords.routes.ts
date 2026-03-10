import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getRecords } from '../controllers/getRecords.controller'

const router = express.Router()

router.post(
    "/getRecords",
    authenticateUser,
    getRecords
)

export default router
import express, { Request, Response } from 'express'
import 'dotenv/config'
import cors from 'cors'
import { corsOptions } from './config/cors'
import userRoutes from './routes/users.routes'
import organizationRoutes from './routes/organization.routes'
import projectRoutes from './routes/project.routes'
import teamRoutes from './routes/team.routes'
import getRecordsRoutes from './routes/getRecords.routes'
import { requestLogger } from './middlewares/logger.middleware'
import { getSystemOverview } from './controllers/getRecords.controllers'


const serverPort = process.env.SERVER_PORT
const app = express()
app.use(express.json())
app.use(cors())


// app.use(requestLogger)
app.use('/api/users', userRoutes)
app.use("/api/organizations", organizationRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/teams", teamRoutes)
app.use("/api", getRecordsRoutes)
app.use("/api/super-admin", getSystemOverview)


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    })
})

app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    })
})

app.get('/', (req: Request, res: Response) => {
    res.send('PRM API is running...')
})
app.listen(serverPort, () => {
    console.log('Server is running on port: ', serverPort)
})
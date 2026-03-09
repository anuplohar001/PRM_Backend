import express, {Request, Response} from 'express'
import 'dotenv/config'
import cors from 'cors'
import { corsOptions } from './config/cors'
import userRoutes from './routes/users.routes'
import organizationRoutes from './routes/organization.routes'
import projectRoutes from './routes/project.routes'


const serverPort = process.env.SERVER_PORT
const app = express()
app.use(express.json())
app.use(cors())



app.use('/api/users', userRoutes)
app.use("/api/organizations", organizationRoutes)
app.use("/api/projects", projectRoutes)



app.get('/', (req:Request, res:Response) => {
    res.send('PRM API is running...')
})
app.listen(serverPort, ()=> {
    console.log('Server is running on port: ', serverPort)
})
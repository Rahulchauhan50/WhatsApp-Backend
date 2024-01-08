import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import AuthRoutes from './routes/AuthRoutes.js'

dotenv.config();
const port = process.env.PORT || 5000
const app = express();

app.use(cors());
app.use(express.json())

app.use("/api/auth",AuthRoutes)

app.listen(port,()=>{
    console.log(`you are listening at ${port}`)
})

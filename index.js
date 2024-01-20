import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import AuthRoutes from './routes/AuthRoutes.js'
import MessageRoutes from "./routes/MessageRoutes.js"
import { Server } from 'socket.io'

dotenv.config();
const port = process.env.PORT || 5000
const app = express();

app.use(cors());
app.use(express.json())

app.use("/api/auth",AuthRoutes)
app.use("/api/messages",MessageRoutes)


const server = app.listen(port,()=>{
    console.log(`you are listening at ${port}`)
})

const io = new Server(server, {
    cors:{
        origin:"http://localhost:3000",
    },
})

global.onlineUsers = new Map();

io.on("connection", (socket)=>{
    global.chatShocket = socket;
    socket.on("add-user", (userId)=>{
        onlineUsers.set(userId, socket.id);
    })
    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", {
                to:data.to,
                from: data.from,
                message: data.message,
            });
        }
        onlineUsers.set(data.to, socket.id);
    })
})

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
app.use(express.json());

app.use("/uploads/images", express.static("uploads/images"));
app.use("/uploads/recordings", express.static("uploads/recordings"));

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
        // console.log(userId)
        onlineUsers.set(userId, socket.id);
        // console.log(onlineUsers)
    })
    socket.on("send-msg", async (data) => {
        const sendUserSocket = await onlineUsers.get(data.recieverId);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", data);
        }
        onlineUsers.set(data.to, socket.id);
    })
})

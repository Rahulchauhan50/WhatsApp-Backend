import getPrismaInstance from "../utils/PrismaClient.js";

export const addMessage = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const {message, from, to} = req.body;
        const getUser = onlineUsers.get(to);
        if(message && from && to){
            const newMessage = await prisma.messages.create({
                data: {
                    message,
                    sender: { connect: { id: from } },
                    reciever: { connect: { id: to } },
                    messageStatus: getUser ? "delivered" : "sent"
                },
                include: { reciever: true, sender: true },  
            });
            return res.status(201).send({message: newMessage});
        }
        return res.status(400).send("From, to and message is required")
    } catch (error) {
        next(error)   
    }
}


export const getMessages = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const {from, to } = req.params;
        const message = await prisma.messages.findMany({
            where:{
                OR:[
                    {
                        senderId:from,
                        recieverId: to
                    },
                    {
                        senderId:to,
                        recieverId: from
                    },
                ],
            },
            orderBy:{
                id:"asc"
            }
        });
        const unReadMeassages = [];
        message.forEach((message, index) => {
            if(message.messageStatus !== "read" && message.senderId === to){
                message.messageStatus = "read";
                unReadMeassages.push(message.id);
            }
            
        });

        await prisma.messages.updateMany({
            where:{id:{in:unReadMeassages},},
            data:{messageStatus:"read"}
        })

        res.status(200).json({message})
    } catch (error) {
        next(error)
        
    }
}
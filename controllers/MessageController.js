import getPrismaInstance from "../utils/PrismaClient.js";
import { renameSync } from "fs";

export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to);
    if (message && from && to) {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          sender: { connect: { id: from } },
          reciever: { connect: { id: to } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { reciever: true, sender: true },
      });
      return res.status(201).send({ message: newMessage });
    }
    return res.status(400).send("From, to and message is required");
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;
    const message = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: from,
            recieverId: to,
          },
          {
            senderId: to,
            recieverId: from,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });
    const unReadMeassages = [];
    message.forEach((message, index) => {
      if (message.messageStatus !== "read" && message.senderId === to) {
        message.messageStatus = "read";
        unReadMeassages.push(message.id);
      }
    });

    await prisma.messages.updateMany({
      where: { id: { in: unReadMeassages } },
      data: { messageStatus: "read" },
    });

    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const addImageMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let filename = "uploads/images/" + date + req.file.originalname;
      renameSync(req.file.path, filename);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;
      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: filename,
            sender: { connect: { id: from } },
            reciever: { connect: { id: to } },
            type: "image",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to required");
    }
    return res.status(400).send("Image, to required");
  } catch (error) {
    next(error);
  }
};

export const addAudioMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let filename = "uploads/recordings/" + date + req.file.originalname;
      renameSync(req.file.path, filename);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;
      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: filename,
            sender: { connect: { id: from } },
            reciever: { connect: { id: to } },
            type: "audio",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to required");
    }
    return res.status(400).send("audio, to required");
  } catch (error) {
    next(error);
  }
};

// export const getInitialContactSwitchMessages = async (req, res, next) => {
//   try {
//     const userId = req.params.from
//     const prisma = getPrismaInstance();
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         sentMessages: {
//           include: {
//             reciever: true,
//             sender: true,
//           },
//           orderBy: {
//             createAt: "desc",
//           },
//         },
//         recievedMessages: {
//           include: {
//             reciever: true,
//             sender: true,
//           },
//           orderBy: {
//             createAt: "desc",
//           },
//         },
//       },
//     });
    
//     const messages = [...user.sentMessages, ...user.recievedMessages];
//     messages.sort((a, b) => (b.createAt && a.createAt ? b.createAt.getTime() - a.createAt.getTime() : 0));
    
//     const users = new Map();
//     const messageStatusChange = [];
//     messages.forEach((msg) => {
//       const isSender = msg.senderId === userId;
//       const calculated = isSender ? msg.recieverId : msg.senderId;
//       if (msg.messageStatus === "sent") {
//         messageStatusChange.push(msg.id);
//       }
//         // Handle the case where the user doesn't exist
//       const {
//         id,
//         type,
//         message,
//         messageStatus,
//         createAt,
//         senderId,
//         recieverId,
//       } = msg;
      
     

//       if (!users.get(calculated)) {
        
//         let user = {
//           messageId: id,
//           type,
//           message,
//           messageStatus,
//           createAt,
//           senderId,
//           recieverId,
//         };
//         if(isSender){
//             user = {
//                 ...user,
//                 ...msg.reciever,
//                 totalUnreadMessages:0
//             }
//         }
//         else{
//           user = {
//             ...user,
//             ...msg.sender,
//             totalUnreadMessages:messageStatus!=="read" ?1 :0
//           }
//             // return res.status(200).json({users,"name":"rahul"});
//         }
//         users.set(calculated,{...user})
//       } 
//       else if (messageStatus !== "read" && !isSender) {

//         const user = users.get(calculated);
//         users.set(calculated, {
//           ...user,
//           totalUnreadMessages: user.totalUnreadMessages + 1,
//         });
//       }
//     });

   

//     if(messageStatusChange.length){
//         await prisma.messages.updateMany({
//             where: { id: { in: messageStatusChange } },
//             data: { messageStatus: "delivered" },
//           });
//     }
    

//     return res.status(200).json({
//         users:Array.from(users.values),
//         onlineUsers:Array.from(onlineUsers.keys())
//     })
//   } catch (error) {
//     next(error)
//   }
// };

export const getInitialContactSwitchMessages = async (req, res, next) => {
  try {
    const userId = req.params.from;
    const prisma = getPrismaInstance();

    // Fetch user and messages
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createAt: "desc",
          },
        },
        recievedMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createAt: "desc",
          },
        },
      },
    });

    // Combine and sort messages
    const messages = [...user.sentMessages, ...user.recievedMessages];
    messages.sort((a, b) => b.createAt.getTime() - a.createAt.getTime());

    // Create a map to track users based on their last message
    const usersMap = new Map();

    // Create a map to track unread messages by other users
    const unreadMessagesMap = new Map();

    // Process messages and populate usersMap and unreadMessagesMap
    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const otherUserId = isSender ? msg.recieverId : msg.senderId;

      if (!usersMap.has(otherUserId)) {
        usersMap.set(otherUserId, {
          id: otherUserId,
          lastMessage: msg,
        });
      }

      if (!isSender && msg.messageStatus !== "read") {
        const unreadCount = unreadMessagesMap.get(otherUserId) || 0;
        unreadMessagesMap.set(otherUserId, unreadCount + 1);
      }
    });

    // Convert map values to an array and sort based on the last message timestamp
    const sortedUsers = Array.from(usersMap.values()).sort(
      (a, b) => b.lastMessage.createAt.getTime() - a.lastMessage.createAt.getTime()
    );

    // Include the unread message count for each sorted user
    const usersWithUnreadCount = sortedUsers.map((sortedUser) => ({
      ...sortedUser,
      unreadMessageCount: unreadMessagesMap.get(sortedUser.id) || 0,
    }));

    return res.status(200).json({
      users: usersWithUnreadCount,
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (error) {
    next(error);
  }
};



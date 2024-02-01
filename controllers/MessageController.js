import getPrismaInstance from "../utils/PrismaClient.js";
import { renameSync } from "fs";
import path from "path";
import fs from 'fs/promises';
import { ObjectId } from 'mongodb';


export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to);
    const messageData = Buffer.from(message, 'base64');
    if (message && from && to) {
      const newMessage = await prisma.messages.create({
        data: {
          message:messageData,
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
    const messages = await prisma.messages.findMany({
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

    // Convert binary data to base64 for image messages
    const messagesWithBase64 = messages.map((message) => {
      return {
        id: message.id,
        senderId: message.senderId,
        recieverId: message.recieverId,
        type: message.type,
        message: message.type === "image" ? message.message.toString('base64') : message.message,
        messageStatus: message.messageStatus,
        createdAt: message.createdAt,
      };
    });

    res.status(200).json({ messages: messagesWithBase64 });
  } catch (error) {
    next(error);
  }
};

export const addImageMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).send("From and to are required");
    }

    // Read image data as a Buffer
    const imageBuffer = await fs.readFile(req.file.path);

    // Store the image data in the database
    const message = await prisma.messages.create({
      data: {
        message: Buffer.from(imageBuffer), // Convert Buffer to Prisma Bytes
        sender: {
          connect: { id: from },
        },
        reciever: {
          connect: { id: to },
        },
        type: 'image',
      },
    });

    // Remove the temporary file
    await fs.unlink(req.file.path);

    return res.status(201).json({ message });
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
            createdAt: "desc", // Fix the ordering field here
          },
        },
        recievedMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createdAt: "desc", // Fix the ordering field here
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



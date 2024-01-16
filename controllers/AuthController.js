import getPrismaInstance from "../utils/PrismaClient.js";

export const checkUser = async(req,res,next) => {
    try {
        const {email} = req.body;
        if(!email){
            return res.json({msg:"Email is require", status:false})
        }
        const prisma = getPrismaInstance();
        const user = await prisma.user.findUnique({where:{ email }})
        if(!user){
            res.json({msg:"user not found",status:false})
        }else{
            res.json({msg:"user found",status:true,data:user})
        }
    } catch (error) {
        next(error);
    }
}

export const onBoardUser = async (req, res, next) => {
    try {
        const { email, name, about, image: profileImage } = req.body;
        if (!email || !name || !about || !profileImage) {
            return res.send("Email, name, about, and profileImage are required.");
        }
        const prisma = getPrismaInstance();
        await prisma.user.create({
            data: { email, name, about, profileImage, status:"true", NewUser:false },
        });
        return res.json({ msg: "Success", status: true });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const users = await prisma.user.findMany({
            orderBy:{name:"asc"},
            select:{
                id:true,
                email:true,
                name:true,
                profileImage:true,
                about:true
            }
        });
        const usersGroupedByInitialLetter = {};

        users.forEach(user => {
            const initialLetter = user.name.charAt(0).toUpperCase();
            if(!usersGroupedByInitialLetter[initialLetter]){
                usersGroupedByInitialLetter[initialLetter] = [];
            }
            usersGroupedByInitialLetter[initialLetter].push(user);
        });
        return res.status(200).send({users:usersGroupedByInitialLetter})
    } catch (error) {
        next(error)
    }
}
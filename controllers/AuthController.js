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

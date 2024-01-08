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
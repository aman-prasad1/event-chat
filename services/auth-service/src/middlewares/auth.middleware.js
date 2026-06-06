import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import jwt from "jsonwebtoken";

export const authenticateAccessToken = async (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return next(new ApiError(401, "Unauthorized: No token provided"));
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decodedToken.id } });

        if (!user) {
            return next(new ApiError(401, "Unauthorized: User not found"));
        }

        req.user = user;
        next();
    } catch (err) {
        return next(new ApiError(401, "Unauthorized: Invalid token"));
    }
}
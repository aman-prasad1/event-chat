import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import { redisClient } from "../redis/index.js";
import jwt from "jsonwebtoken";

export const authenticateAccessToken = async (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return next(new ApiError(401, "Unauthorized: No token provided"));
    }

    // check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklisted:${token}`);
    if(isBlacklisted) {
        return next(new ApiError(401, "Unauthorized: Token is blacklisted"));
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedToken?.id) {
            return next(new ApiError(401, "Unauthorized: User not found"));
        }

        req.user = decodedToken;
        next();
    } catch (err) {
        return next(new ApiError(401, "Unauthorized: Invalid token"));
    }
}
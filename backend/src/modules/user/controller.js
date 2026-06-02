import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { redisClient } from '../../redis/index.js';


const getUserProfile = asyncHandler(async (req, res) => {
    const user = {
        id: req.user.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        username: req.user.username,
        avatar_url: req.user.avatar_url,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
    }
    
    res
        .status(200)
        .json(new ApiResponse(200, 'User profile retrieved successfully', { user }));
});

const searchUsers = asyncHandler(async (req, res) => {
    try {
        
        const { query } = req.query;

        if (!query || query.trim() === '') {
            throw new ApiError(400, 'Query parameter is required');
        }


        // Check Redis cache first
        const redisKey = `user_search:${query.toLowerCase()}`;
        const cachedResult = await redisClient.get(redisKey);
        if (cachedResult) {
            const users = JSON.parse(cachedResult);
            return res
                .status(200)
                .json(new ApiResponse(200, 'Users retrieved successfully (from cache)', { users }));
        }


        // Fetch users from database
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { first_name: { startsWith: query, mode: 'insensitive' } },
                    { last_name: { startsWith: query, mode: 'insensitive' } },
                    { username: { startsWith: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                username: true,
                avatar_url: true
            },
            take: 15
        });

        // Cache the result in Redis for 1 hour
        await redisClient.set(
            redisKey,
            JSON.stringify(users),
            'EX',
            3600 // 1 hour in seconds
        );

        res
            .status(200)
            .json(new ApiResponse(200, 'Users retrieved successfully', { users }));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to search users');
    }
});

export { 
    getUserProfile,
    searchUsers
};
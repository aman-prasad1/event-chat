import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';


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

export { getUserProfile };
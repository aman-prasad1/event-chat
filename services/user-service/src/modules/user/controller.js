import bcrypt from 'bcrypt';
import fs from 'fs';
import { AVATAR_CLEANUP_TOPIC } from '../../constants.js';
import { prisma } from '../../db/index.js';
import { kafkaProducer } from '../../kafka/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';


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

        res
            .status(200)
            .json(new ApiResponse(200, 'Users retrieved successfully', { users }));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to search users');
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const updateData = {};

        if(req.body?.username && req.body?.username.trim() !== '') {
            const existingUser = await prisma.user.findUnique({
                where: { username: req.body.username.trim() }
            });

            // if new username is taken by another user, throw error
            if (existingUser && existingUser.id !== req.user.id) {
                throw new ApiError(400, 'Username is already taken');
            }

            // if username is valid and not taken, add it to update data
            updateData.username = req.body.username.trim();
        }

        if(req.body?.first_name && req.body?.first_name.trim() !== '') {
            updateData.first_name = req.body.first_name.trim();
        }

        if(req.body?.last_name && req.body?.last_name.trim() !== '') {
            updateData.last_name = req.body.last_name.trim();
        }


        if(req.file) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            const old_avatar_key = user.avatar_key;

            const cloudinaryResponse = await uploadOnCloudinary(req.file.path, "avatars/");
            if(cloudinaryResponse) {
                updateData.avatar_url = cloudinaryResponse.url;
                updateData.avatar_key = cloudinaryResponse.public_id;
            }

            // delete old avatar from cloudinary if it exists
            await kafkaProducer.send({
                topic: AVATAR_CLEANUP_TOPIC,
                messages: [
                    {
                        value: JSON.stringify({ avatar_key: old_avatar_key })
                    }
                ]
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                username: true,
                avatar_url: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res
            .status(200)
            .json(new ApiResponse(200, 'User profile updated successfully', { user: updatedUser }));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to update user profile');
    } finally {
        // delete local file after processing
        if(req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log("Error while deleting local file!!!", err);
                }
            });
        }
    }
})

const deleteAccount = asyncHandler(async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if(!password || password.trim() === '') {
            throw new ApiError(400, 'Password is required');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(400, 'Password is incorrect');
        }
        

        // if user has a custom avatar, send message to Kafka to delete it from cloudinary
        const avatar_key = user.avatar_key;
        if(avatar_key) {
            await kafkaProducer.send({
                topic: AVATAR_CLEANUP_TOPIC,
                messages: [
                    {
                        value: JSON.stringify({ avatar_key })
                    }
                ]
            });
        }

        await prisma.user.delete({ where: { id: userId } });

        res
            .status(200)
            .clearCookie('accessToken', { path: '/' })
            .clearCookie('refreshToken', { path: '/' })
            .json(
                new ApiResponse(200, 'Account deleted successfully')
            );
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Internal Server Error');
    }
});

export {
    deleteAccount, getUserProfile,
    searchUsers,
    updateUserProfile
};


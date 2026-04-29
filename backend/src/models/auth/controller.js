import { prisma } from '../../db/index.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';
import { UserType } from './types.js';


const generateAccessToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
    };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });
};
const generateRefreshToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });
};

const register = asyncHandler(async (req, res) => {
    try {
        const { first_name, last_name, username, password } = req.body;
    
        // Validate that all fields are provided and not empty
        if ([first_name, last_name, username, password].some(field => !field || field.trim() === '')) {
            throw new ApiError(400, 'All fields are required');
        }
    
        // check if the file is provided
        if (!req.file) {
            throw new ApiError(400, 'Profile image is required');
        }
    
        // Check if the username already exists
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            throw new ApiError(400, 'Username already exists');
        }
    
        // Upload image to cloudinary and remove the local file after uploading
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'avatars');
        if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
            throw new ApiError(500, 'Failed to upload profile image');
        }
    
        // Hashing the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create the new user in the database
        const newUser = await prisma.user.create({
            data: {
                first_name,
                last_name,
                username,
                password: hashedPassword,
                avatar_key: cloudinaryResponse.public_id,
                avatar_url: cloudinaryResponse.secure_url
            },
        });
    
        // checking the newly created user
        const createdUser = await prisma.user.findUnique({ 
            where: { id: newUser.id },
            select: UserType
        });

        
        // Ensure that the local file is deleted after processing
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting local file:', err);
            }
        });
    
    
        res
            .status(201)
            .json(
                new ApiResponse(201, 'User registered successfully', createdUser)
            );

    } catch (error) {
        // Ensure that the local file is deleted even if an error occurs
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting local file:', err);
            }
        });
        throw new ApiError(error.statusCode || 500, error.message || 'Internal Server Error');
    }
});


const login = asyncHandler(async (req, res) => {
    
    try {
        const { username, password } = req.body;
    
        // Validate that all fields are provided and not empty
        if ([username, password].some(field => !field || field.trim() === '')) {
            throw new ApiError(400, 'All fields are required');
        }
    
        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new ApiError(400, 'Invalid username or password');
        }
    
        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(400, 'Invalid username or password');
        }
    
        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
    
        // Store the refresh token in the database
        await prisma.user.update({
            where: { id: user.id },
            data: { refresh_Token: refreshToken }
        });
        
        
        // Prepare the response data without sensitive information
        const responseData = {
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_url: user.avatar_url,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000 * 7,
            path: '/'
        }
    
        res
            .status(200)
            .cookie('refreshToken', refreshToken, options)
            .cookie('accessToken', accessToken, options)
            .json(
                new ApiResponse(200, 'Login successful', responseData)
            );
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Internal Server Error');
    }
});

const refreshTokens = asyncHandler(async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
    
        if (!refreshToken) {
            throw new ApiError(401, 'Unauthorized: No refresh token provided');
        }
    
        // Verify the refresh token
        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Check if the refresh token exists in the database
        const user = await prisma.user.findUnique({ where: { id: decodedToken.id } });
        if (!user || user.refresh_Token !== refreshToken) {
            throw new ApiError(401, 'Unauthorized: Refresh token not found');
        }
    
        // Generate a new access token
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
    
        // Update the refresh token in the database
        await prisma.user.update({
            where: { id: user.id },
            data: { refresh_Token: newRefreshToken }
        });
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000 * 7,
            path: '/'
        }
    
        res
            .status(200)
            .cookie('accessToken', newAccessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(200, 'Access token refreshed successfully')
            );
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Internal Server Error');
    }
});


export { 
    register,
    login,
    refreshTokens
}
import { prisma } from '../../db/index.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';
import { UserType } from './types.js';


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
                new ApiResponse(201, createdUser, 'User registered successfully')
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


export { register,}
import { deleteFromCloudinary } from '../utils/cloudinary.js';


const handleAvatarCleanupTopic = async ({ message }) => {
    try {
        const { avatar_key } = JSON.parse(message.value.toString());

        // delete avatar from cloudinary
        await deleteFromCloudinary(avatar_key);
    } catch (error) {
        console.error('Error processing avatar cleanup:', error);
        throw error;
    }
}

export {
    handleAvatarCleanupTopic
}
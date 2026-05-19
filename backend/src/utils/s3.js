import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});


// Upload file to S3
const uploadToS3 = async (file) => {
    try {
        const fileExtension = file.originalname.split('.').pop();
        const key = `uploads/${uuidv4()}.${fileExtension}`; // unique key for each file
    
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
    
        return key;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
};


// Generate a signed URL for a file (valid for 1 hour)
const getSignedFileUrl = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        });
    
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
        return url;
    } catch (error) {
        console.error('Error generating signed URL for S3 file:', error);
        throw error;
    }
};


// Delete file from S3
const deleteFromS3 = async (key) => {
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        }));
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
};

export { uploadToS3, getSignedFileUrl, deleteFromS3 };
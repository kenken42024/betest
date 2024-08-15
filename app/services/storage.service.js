import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../config/storage.js';  // Assuming you have configured AWS S3 or other storage provider in a storage config file

const uploadToCloud = async (params) => {
    const command = new PutObjectCommand(params);
    await s3.send(command);
};

const downloadFromCloud = async (params) => {
    try {
        const command = new GetObjectCommand(params);
        const data = await s3.send(command);

        console.log(data.Body)

        if (!data.Body) {
            throw new Error('No Body in response from S3');
        }

        const stream = data.Body;
        return stream;
    } catch (err) {
        console.error('Error in downloadFromCloud:', err); // Log the error
        throw new Error('Error downloading file from S3: ' + err.message);
    }
};

const deleteFromCloud = async (params) => {
    try {
        const command = new DeleteObjectCommand(params);
        const data = await s3.send(command);

        return data;
    } catch (err) {
        console.error('Error in deletFromCloud:', err); // Log the error
        throw new Error('Error deleting file from S3: ' + err.message);
    }
};

const getFileAttr = (file) => {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: file.filename || file.file_name,
        ContentType: file.mimetype || file.mime_type
    }

    return params
}

export const storageUpload = async (provider, request) => {
    if (provider === 's3') {
        let params = getFileAttr(request);
        await uploadToCloud(params);
    } else {
        throw new Error('Unsupported storage provider');
    }
};

export const downloadUpload = async (provider, request) => {
    if (provider === 's3') {
        let params = getFileAttr(request);
        return await downloadFromCloud(params);
    } else {
        throw new Error('Unsupported storage provider');
    }
};

export const deleteUpload = async (provider, request) => {
    if (provider === 's3') {
        let params = getFileAttr(request);
        return await deleteFromCloud(params);
    } else {
        throw new Error('Unsupported storage provider');
    }
};
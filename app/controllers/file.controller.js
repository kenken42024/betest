import File from '../models/files.model.js' // Model
import DownloadLog from '../models/downloadLogs.model.js';
import { asyncHandler } from '../middlewares/error.middleware.js' // For error handling
import bcrypt from 'bcrypt' // for Public and Private key
import path from 'path'; // for storage
import fs from 'fs'; // directory
import { fileURLToPath } from 'url'; // 
import dotenv from 'dotenv';
import { deleteUpload, downloadUpload, storageUpload } from '../services/storage.service.js';
import moment from 'moment'

dotenv.config()

// Resolve the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = process.env.PROVIDER || 'local'

export const uploadFile = asyncHandler(async (request, response, next) => {
    try {
        // Retrieve the uploader's IP address
        const uploaderIP = request.ip;

        // Define the daily limit
        const dailyLimit = process.env.UPLOAD_LIMIT;

        // Get the start of today
        const startOfDay = moment().startOf('day').toDate();

        // Count uploads from the same IP from the current date
        const uploadCount = await File.countDocuments({
            from_ip: uploaderIP,
            upload_date: { $gte: startOfDay }
        });

        if (uploadCount >= dailyLimit) {
            return response.status(429).json({ errors: 'Daily upload limit exceeded' });
        }

        // Generate random strings for public and private keys
        const rawPublicKey = Math.random() + new Date().toLocaleDateString();
        const rawPrivateKey = Math.random() + new Date().toLocaleDateString();

        // Hash the keys using bcrypt
        const publicKeyHash = await bcrypt.hash(rawPublicKey, 10);
        const privateKeyHash = await bcrypt.hash(rawPrivateKey, 10);
        
        // Save file upload to MongoDB
        const newFile = new File({
            public_key: publicKeyHash,
            private_key: privateKeyHash,
            path: process.env.FOLDER,
            file_name: request.file.filename,
            original_file_name: request.file.originalname,
            file_size: request.file.size,
            mime_type: request.file.mimetype,
            from_ip: uploaderIP,
            upload_date: new Date() // Save the upload date
        });

        await newFile.save();

        if (newFile && storage !== 'local') {
            await storageUpload(storage, request.file);
        }

        if(newFile) {
            return response.json({
                publicKey: newFile.public_key,
                privateKey: newFile.private_key
            });
        } else {
            return response.status(500).json({ message: "File was not saved!"})
        }
    } catch (error) {
        return response.status(500).json({ errors: error.message });
    }
});

export const downloadFile = asyncHandler(async (request, response, next) => {
    try {
        const hashedPublicKey = request.params.key;
    
        if (!hashedPublicKey) {
            return response.status(400).render('errors/error', { message: 'Invalid file identifier' });
        }
    
        const publicKey = decodeURIComponent(hashedPublicKey);
        const file = await File.findOne({ public_key: publicKey });
    
        if (!file) {
            return response.status(404).render('errors/404', { message: 'File not found' });
        }
        
        // Retrieve the IP address
        const ipAddress = request.ip;

        // Define the daily limit
        const dailyLimit = 5; // Example: Limit of 5 downloads per day

        // Get the start of today
        const startOfDay = moment().startOf('day').toDate();

        // Count downloads from the same IP today
        const downloadCount = await DownloadLog.countDocuments({
            ip_address: ipAddress,
            timestamp: { $gte: startOfDay }
        });

        if (downloadCount >= dailyLimit) {
            return response.status(429).json({ errors: 'Daily download limit exceeded' });
        }

        // Log the download request
        await new DownloadLog({ ip_address: ipAddress }).save();

        // Increment the download count
        await File.updateOne({ public_key: publicKey }, { $inc: { download_count: 1 } });

        if (storage === 'local') {
            // Path to the file
            const filePath = path.join(__dirname, '../../', 'storage', 'uploads', file.file_name);
    
            // Check if the file exists
            if (!fs.existsSync(filePath)) {
                return response.status(404).render('errors/404', { message: 'File not found on the server' });
            }
    
            // Set the correct MIME type for the file
            response.setHeader('Content-Type', file.mime_type);
    
            // Stream the file back to the client
            response.download(filePath, file.original_file_name, (err) => {
                if (err) {
                    return next(err);
                }
            });
        } else if (storage === 's3') {
            // Set the correct MIME type for the file
            response.setHeader('Content-Type', file.mime_type);
            response.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    
            try {
                const stream = await downloadUpload(storage, file);
                if (!stream) {
                    throw new Error('No stream returned from downloadUpload');
                }
                stream.pipe(response);
            } catch (error) {
                console.error('Error downloading file:', error);
                response.status(500).render('errors/error', { message: 'Error downloading file from S3' });
            }
        } else {
            return response.status(400).render('errors/error', { message: 'Invalid storage type' });
        }
    } catch (error) {
        return response.status(500).json({ errors: error.message });
    }
});

export const deleteFile = asyncHandler(async (request, response, next) => {
    try {
        const hashedPrivateKey = request.params.key;

        if (!hashedPrivateKey) {
            console.log('No private key provided');
            return response.status(400).render('errors/error', { message: 'Invalid file identifier' });
        }

        const privateKey = decodeURIComponent(hashedPrivateKey);
        console.log('Decoded private key:', privateKey);

        const file = await File.findOne({ private_key: privateKey });

        // Remove the file record from the database
        await File.deleteOne({ private_key: privateKey });
        console.log('Database record deleted');

        if (!file) {
            console.log('File not found');
            return response.status(404).json({message: "File not found"})
        }

        if (storage === 'local') {
            // Delete file from local storage
            const filePath = path.join(__dirname, '../../', 'storage', 'uploads', file.file_name);
            console.log('File path:', filePath);

            if (!fs.existsSync(filePath)) {
                console.log('File does not exist or has already been deleted');
                return response.status(404).render('errors/404', { message: 'The file has been deleted already or does not exist anymore' });
            }

            fs.unlinkSync(filePath);
            console.log('File deleted successfully');

            return response.json({ message: "File has been deleted successfully!" });
        } 
        else if (storage === 's3') {
            try {
                await deleteUpload(storage, file);

                console.log('File deleted successfully from S3');
                return response.json({ message: "File has been deleted successfully from S3!" });
            } catch (err) {
                console.error('Error deleting file from S3:', err);
                return response.status(500).json({ errors: 'Error deleting file from S3' });
            }
        }
    } catch (error) {
        console.error('Error in deleteFile:', error);
        return response.status(500).json({ errors: error.message });
    }
});

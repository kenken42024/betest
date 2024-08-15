import cron from 'node-cron';
import File from '../models/files.model.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { deleteUpload } from '../services/storage.service.js';
import { fileURLToPath } from 'url';

dotenv.config(); // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = process.env.PROVIDER || 'local'

// Function to delete files
const deleteFile = async (file) => {
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
};

// Function to remove old files from DB and storage
const cleanUpOldFiles = async () => {
    try {
        // Get the current date and calculate the cutoff date for inactivity
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(process.env.INACTIVE_PERIOD, 10));
        
        // Find files older than the cutoff date and have not been downloaded within the period
        const oldFiles = await File.find({
            updatedAt: { $lt: cutoffDate }
        });

        // Delete each old file from storage and database
        for (const file of oldFiles) {
            try {
                // Delete the file from the respective storage (local or S3)
                await deleteFile(file);

                // Delete the file record from the database
                await File.deleteOne({ _id: file._id });
                console.log(`Deleted file record from DB: ${file.file_name}`);
            } catch (error) {
                console.error(`Error deleting file ${file.file_name}:`, error);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old files:', error);
    }
};

// Schedule the cleanup job (e.g., every day at midnight)
cron.schedule('0 0 * * *', () => {
    console.log('Running file cleanup job...');
    cleanUpOldFiles();
});

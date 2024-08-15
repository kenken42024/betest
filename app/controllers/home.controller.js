import File from '../models/files.model.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

// Helper function to safely encode the hash
const safeHash = (hash) => encodeURIComponent(hash);

export const homeIndex = asyncHandler(async (request, response, next) => {
    try {
        // Fetch all uploaded files from the database
        const files = await File.find().sort({ created_at: -1 });

        // Encode public key as a safe hash to avoid URL issues
        const fileData = files.map(file => ({
            fileLink: `${request.protocol}://${request.get('host')}/files/${encodeURIComponent(file.public_key)}`,
            deleteLink: file.private_key,
            fileName: file.original_file_name
        }));

        // Render the index view and pass the files data
        response.render('index', { files: fileData });
    } catch (error) {
        return response.status(500).json({
            errors: error.message
        });
    }
});

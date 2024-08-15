import multer from "multer";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const storageProvider = process.env.PROVIDER || 'local';

// Use a path relative to the project root
const uploadDir = path.resolve(__dirname, '../../', process.env.FOLDER);

if (storageProvider === 'local') {
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Directory created:', uploadDir);
        } else {
            console.log('Directory already exists:', uploadDir);
        }
    } catch (err) {
        console.error('Error creating directory:', err);
    }
}

let uploadSingleFile;

if (storageProvider === 'local') {
    // Use disk storage for local provider
    const diskStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    });
    uploadSingleFile = multer({ storage: diskStorage }).single('file');
} else {
    // Use memory storage for other providers
    uploadSingleFile = multer({
        storage: multer.memoryStorage()
    }).single('file');

    // Middleware to manually set the filename for other storage provider
    uploadSingleFile = (req, res, next) => {
        multer({
            storage: multer.memoryStorage()
        }).single('file')(req, res, (err) => {
            if (err) return next(err);
            if (req.file) {
                req.file.filename = `${Date.now()}-${req.file.originalname}`;
            }
            next();
        });
    };
}

export { uploadSingleFile };

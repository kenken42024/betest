import dotenv from 'dotenv';
import express from 'express';
import db from './config/db.js';
import router from './routes/routes.js';
import methodOverride from 'method-override'; // Tried for delete method
import './app/schedulers/file.scheduler.js'; // Scheduler for removing inactive files

dotenv.config()

const app = express();
const port = process.env.PORT || 8080;

db()
    .then(() => {
        console.log('Connected to MongoDB');
        console.log(`Environment Port: ${process.env.PORT}`);
        console.log(`Using Port: ${port}`);

        // Load Request Body parser
        app.use(express.json())
        app.use(express.urlencoded({ extended: true }));

        // To get the client's IP
        app.set('trust proxy', true)

        // Simple UI for handling uploads and downloads 
        app.set('view engine', 'ejs')

        // Initialize Assets (CSS/SCSS)
        app.use(express.static('views/assets'));
        
        // Load Routes
        app.use('/', router)
        app.use(methodOverride('_method'));

        app.listen(port, (error) => {
        if (error) {
            console.error(`Failed to start server on port ${port}, error`);
            process.exit(1);
        } else {
            console.log(`Server is listening on port ${port}`);
        }
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    });
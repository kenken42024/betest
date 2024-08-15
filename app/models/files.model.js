import { Schema, model } from "mongoose";

const filesSchema = new Schema({
        public_key: {
            type: String,
            required: [true, 'Public key is required'],
            trim: false
        },
        private_key: {
            type: String,
            required: [true, 'Public key is required'],
            trim: false
        },
        path: {
            type: String,
            required: [true, 'Path is required'],
        },
        file_name: {
            type: String,
            required: [false, '']
        },
        original_file_name: {
            type: String
        },
        mime_type: {
            type: String
        },
        file_size: {
            type: String
        },
        latest_download: {
            type: Date
        },
        from_ip: {
            type: String
        },
        download_count: {
            type: Number,
            default: 0
        },
        upload_date: { 
            type: Date, 
            default: Date.now 
        } // Track upload date
    },
    { timestamps: true }
);

const File =  model('File', filesSchema);

export default File
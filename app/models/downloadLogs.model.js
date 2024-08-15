import { Schema, model } from "mongoose";

const downloadLogSchema = new Schema({
    ip_address: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const DownloadLog = model('DownloadLog', downloadLogSchema);

export default DownloadLog;
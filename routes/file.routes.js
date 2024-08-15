import { Router } from 'express'
import { uploadFile, downloadFile, deleteFile } from './../app/controllers/file.controller.js';
import { uploadSingleFile } from './../app/middlewares/upload.middleware.js'

const fileRouter = Router()

fileRouter.post(
    '/',
    uploadSingleFile,
    uploadFile
);

fileRouter.post('/:key', deleteFile);
fileRouter.get('/:key', downloadFile)

export default fileRouter
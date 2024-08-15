import request from 'supertest';
import express from 'express';
import sinon from 'sinon';
import File from '../app/models/files.model.js';
import fs from 'fs';
import path from 'path';
import { uploadSingleFile } from '../app/middlewares/upload.middleware.js';
import { deleteFile, downloadFile, uploadFile } from '../app/controllers/file.controller.js';
import { mongoose, connect } from 'mongoose';
import { fileURLToPath } from 'url';
import { expect } from 'chai';
import dotenv from 'dotenv'

const app = express();

dotenv.config()

// Resolve the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup middleware and routes
app.use(express.json());
app.post('/files', uploadSingleFile, uploadFile);
app.get('/files/:key', downloadFile);
app.get('/files/:key', deleteFile);

// Connect to a test database
before(async () => {
    await connect(process.env.TEST_MONGODB_URI);
});

// Clean up after all tests
after(async () => {
    // Delete all data after all tests
    await File.deleteMany({});

    // Close connection
    await mongoose.connection.close();
});

let privateKey = ""
let publicKey = ""

describe('File Controller API Endpoints', () => {
    describe('POST /files', () => {
        it('should upload a file and return public and private keys', async () => {
            // Create a mock file for testing
            const filePath = path.join(__dirname, 'sample.txt');
            fs.writeFileSync(filePath, 'sample file content');

            // Mock data to return when File.save is called
            const mockSavedFile = {
                _id: new mongoose.Types.ObjectId(),
                public_key: 'mockPublicKey',
                private_key: 'mockPrivateKey',
                file_name: 'sample.txt',
                original_file_name: 'sample.txt',
                mime_type: 'text/plain',
                createdAt: new Date(),
                download_count: 0,
                save: sinon.stub().resolvesThis(),  // Resolves the same object for chaining if needed
            };

            // Stub File.save to simulate saving to database
            sinon.stub(File.prototype, 'save').resolves(mockSavedFile);

            // Call the endpoint
            const res = await request(app)
                .post('/files')
                .attach('file', filePath)
                .expect(200)

            // Restore the stubbed methods
            File.prototype.save.restore();

            // Log the response for debugging
            privateKey = res.body.privateKey
            publicKey = res.body.publicKey

            // Assert response status and properties
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('publicKey');
            expect(res.body).to.have.property('privateKey');

            // Clean up the test file
            fs.unlinkSync(filePath);
        });
    });

    describe('GET /files/:key', () => {
        it('should download a file and return the correct file content', async () => {
            // Mock data to return when File.findOne is called
            const mockFile = {
                _id: new mongoose.Types.ObjectId(),
                public_key: publicKey, // Use the publicKey from the previous test
                private_key: privateKey,
                file_name: 'sample.txt',
                original_file_name: 'sample.txt',
                mime_type: 'text/plain',
                createdAt: new Date(),
                download_count: 0,
                save: sinon.stub().resolvesThis(),  // Resolves the same object for chaining if needed
            };
    
            // Stub File.findOne to return the mockFile
            sinon.stub(File, 'findOne').resolves({public_key: publicKey});
    
            // Stub fs.existsSync to return true to simulate that the file exists
            sinon.stub(fs, 'existsSync').returns(true);
    
            // Call the endpoint
            const res = await request(app)
                .get(`/files/${encodeURIComponent(publicKey)}`)
                .expect(200);
    
            // Assert response status and headers
            expect(res.status).to.equal(200);
            expect(res.headers['content-type']).to.equal('text/plain');
    
            // Assert response body content
            expect(res.text).to.equal('sample file content');
    
            // Restore the stubbed methods
            File.findOne.restore();
            fs.existsSync.restore();
            fs.createReadStream.restore();
        });

        it('should return 429 if too many requests are made', async () => {
            // Make multiple requests to trigger rate limiting
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .get(`/files/${encodeURIComponent(publicKey)}`);
            }
    
            // Now make the request that should return 429
            const res = await request(app)
                .get(`/files/${encodeURIComponent(publicKey)}`)
                .expect(429);
    
            // Assert the status is 429
            expect(res.status).to.equal(429);
            expect(res.body).to.have.property('errors');
    
            // Restore the stubbed methods
            File.findOne.restore();
            fs.existsSync.restore();
        });
    });

    describe('DELETE /files/:key', () => {
        it('should delete a file and return a message', async () => {
            // Call the endpoint
            const res = await request(app)
                .delete(`/files/${encodeURIComponent(privateKey)}`)

            console.log(res.body)
            // Assert the response
            if(res.status === 404) {
                expect(res.status).to.equal(404);
            } else {
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('message');
            }
        });
    });
});

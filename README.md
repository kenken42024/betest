# Node JS Backend Code Test

## Setup

1. **Install Dependencies**:
   - Run the following command to install all necessary dependencies:
     ```bash
     npm install
     ```

2. **Start the Project**:
   - Use the following command to start the development server:
     ```bash
     npm start
     ```

3. **Testing**:
   - Perform tests to ensure the application is working as expected.

## File Sharing API Server Requirements

### 1. HTTP REST API Endpoints

#### a. POST /files
- **Description**: This endpoint is used to upload new files. It accepts `multipart/form-data` requests and returns a JSON response with the attributes `publicKey` and `privateKey`.
- **Status**: Implemented

#### b. GET /files/:publicKey
- **Description**: This endpoint allows the downloading of existing files. It accepts `publicKey` as a request parameter and returns a response stream with a MIME type representing the actual file format.
- **Status**: Implemented

#### c. DELETE /files/:privateKey
- **Description**: This endpoint is used to remove existing files. It accepts `privateKey` as a request parameter and returns a JSON response confirming the file removal.
- **Status**: Implemented

### 2. File Access Component

#### a. Component Functionality
- **Description**: All file access functionality should be encapsulated in a separate component that handles file processing and provides a simple interface for all actions.
- **Status**: Implemented

#### b. Local File Handling
- **Description**: The default implementation should work with local files located inside a root folder defined in the `FOLDER` environment variable.
- **Status**: Implemented

#### c. Cloud Storage Integration
- **Description**: The component should support other storage providers like Google Cloud Storage, Microsoft Azure Storage, or AWS Cloud Storage using the same interface.
- **Status**: Implemented

### 3. Configurable Limits
- **Description**: The API Server should implement configurable daily download and upload limits for network traffic from the same IP address.
- **Status**: Implemented

### 4. Cleanup Job
- **Description**: The API Server should have an internal job to clean up uploaded files after a configurable period of inactivity.
- **Status**: Implemented

### 5. Integration Tests
- **Description**: All HTTP REST API endpoints should be covered by integration tests to ensure functionality and reliability.
- **Status**: I tried using `sinon`, `chai` and `supertest`, but the unit testing I created is not yet fully working and has some issues. 

### 6. Unit Tests
- **Description**: All individual component methods should be covered by unit tests to verify their correctness and robustness.
- **Status**: The same as requirement #5 I tried using `sinon`, `chai` and `supertest`, but the unit testing I created is not yet fully working and has some issues. 

---

## ENV
- MONGODB_URI=''
- PORT=''
- BASE_URL=''

- STORAGE_PROVIDER=''
- FOLDER=''

- REMOVEINACTIVE=10
- UPLOAD_LIMIT=5
- DOWNLOAD_LIMIT=5

- AWS_BUCKET=''
- AWS_BUCKET_REGION=''
- AWS_S3_ACCESS_KEY=''
- AWS_S3_SECRET_ACCESS_KEY=''


---
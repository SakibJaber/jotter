
# Jotter - Storage Management System

Jotter is a Node.js-based storage management system that allows users to upload, manage, and share files (PDFs, images, and text documents) with a total storage limit of 15GB per user. Built with Express.js, MongoDB, and Multer, it provides a robust API for file operations, including storage overview and detailed file information.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [License](#license)

---

## Features

- **File Upload**: Upload PDFs and images to `uploads/documents/` or `uploads/images/`, and create text documents stored in MongoDB.
- **File Management**: List, retrieve, update, rename, duplicate, copy, and delete files.
- **Storage Overview**: View total storage (15GB), used space, and available space.
- **Storage Details**: Get detailed information about uploaded files (PDFs and images), including sizes and paths.
- **File Sharing**: Generate expiring share links for files (1–30 days).
- **Authentication**: Secure endpoints with JWT-based authentication.
- **Pagination and Sorting**: Efficiently list files with customizable sorting and pagination.

---

## Technologies

- **Node.js**: JavaScript runtime for the backend.
- **Express.js**: Web framework for API routing.
- **MongoDB**: NoSQL database for storing file metadata and documents.
- **Mongoose**: ODM for MongoDB interactions.
- **Multer**: Middleware for handling file uploads.
- **JWT**: JSON Web Tokens for authentication.
- **Crypto**: For generating secure share tokens.
- **Moment**: For parse, validate, manipulate, and display dates and times.

---

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/SakibJaber/jotter.git
   cd jotter
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up MongoDB**:
   - Install MongoDB locally or use MongoDB Atlas.
   - Ensure MongoDB is running at `mongodb://localhost:27017/jotter` or update the connection string in `config/db.js`.

4. **Create Upload Directories**:

   ```bash
   mkdir -p uploads/documents uploads/images
   ```

   - Ensure the Node.js process has write permissions to these directories.

---

## Configuration

1. **Environment Variables**:

   Create a `.env` file in the root directory:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/jotter
   JWT_SECRET=your_jwt_secret_key
   ```

   Replace `your_jwt_secret_key` with a strong, secure key.


---

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in and receive a JWT.
- `POST /api/auth/forgot-password`: Request a password reset.
- `POST /api/auth/verify-code`: Verify reset code.
- `POST /api/auth/reset-password`: Reset password.
- `POST /api/auth/logout`: Log out (requires auth).
- `DELETE /api/auth/me`: Delete the current user (requires auth).

- `GET /api/auth/google`: Start Google OAuth login.
- `GET /api/auth/google/callback`: Google OAuth callback URL.

### File Management

- `POST /api/files`: Upload a file or create a document.
- `GET /api/files`: List files (with pagination, sorting, filters).
- `GET /api/files/:id`: Retrieve file details.
- `PUT /api/files/:id`: Update file (name, content, isFavorite).
- `DELETE /api/files/:id`: Delete file.
- `GET /api/files/:id/content`: Download file content.
- `PUT /api/files/:id/rename`: Rename file.
- `POST /api/files/:id/duplicate`: Duplicate file.
- `POST /api/files/:id/copy`: Copy file to another folder.
- `POST /api/files/:id/share`: Generate a share link.
- `GET /api/files/share/:token`: Access shared file.
- `GET /api/files/filter-by-date`: Date Filtering.
- `GET /api/files/share/:token/content`: Download shared content.

### Storage

- `GET /api/files/overview`: Get 15GB storage overview.
- `GET /api/files/storage-details`: Detailed file sizes and paths.

### Folder Management

- `POST /api/folders`: Create a folder.
- `GET /api/folders`: List folders.
- `GET /api/folders/:id`: Get folder details.
- `PUT /api/folders/:id`: Update folder.
- `DELETE /api/folders/:id`: Delete folder.

---




## Testing

- **Manual Testing**:
  - Use Postman to validate all endpoints.
  - Confirm uploads in `uploads/documents/` and `uploads/images/`.
  - Use MongoDB shell or Compass to inspect file metadata.


---



## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Author**: Sakib Al Jaber  
**GitHub**: [https://github.com/SakibJaber/jotter](https://github.com/SakibJaber/jotter)


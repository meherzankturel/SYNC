import express, { Request, Response, NextFunction } from 'express';
import { upload } from '../utils/fileUpload';
import { uploadToGridFS, getFileURL, initGridFS } from '../utils/gridfs';
import Media from '../models/Media.model';
import multer from 'multer';

const router = express.Router();

// Initialize GridFS
initGridFS();

// Multer error handler middleware
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Multer middleware - checking for errors');
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error:', err.code, err.message);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('❌ Upload error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Upload multiple files (batch upload)
router.post('/upload-multiple', (req: Request, res: Response, next: NextFunction) => {
  console.log('📤 Upload request received');
  console.log('📋 Content-Type:', req.headers['content-type']);
  console.log('📋 Content-Length:', req.headers['content-length']);
  next();
}, upload.array('files', 10), handleMulterError, async (req: Request, res: Response) => {
  console.log('📁 Files after multer:', req.files ? (req.files as any[]).length : 0);
  console.log('📋 Body keys:', Object.keys(req.body));
  
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.error('❌ No files in request after multer processing');
      console.log('📋 Request body:', req.body);
      return res.status(400).json({ error: 'No files provided. Make sure files are sent with field name "files".' });
    }
    
    console.log('📁 Processing', req.files.length, 'files');
    for (const file of req.files as Express.Multer.File[]) {
      console.log(`  - ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
    }

    // Get userId from request (should come from auth middleware in production)
    const userId = (req as any).userId || req.body.userId || 'anonymous';
    const dateNightId = req.body.dateNightId;
    const reviewId = req.body.reviewId;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedURLs: string[] = [];
    const mediaRecords: any[] = [];

    // Upload each file
    for (const file of req.files as Express.Multer.File[]) {
      try {
        // Determine file type
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const type = isVideo ? 'video' : 'image';

        // Upload to GridFS
        const fileId = await uploadToGridFS(file, userId, {
          dateNightId,
          reviewId,
          type,
        });

        // Generate URL
        const url = getFileURL(fileId, baseUrl);

        // Save metadata to MongoDB
        const mediaDoc = new Media({
          userId,
          dateNightId,
          reviewId,
          type,
          url,
          filename: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        });
        await mediaDoc.save();

        uploadedURLs.push(url);
        mediaRecords.push(mediaDoc);
      } catch (fileError: any) {
        console.error('❌ Error uploading file:', file.originalname, fileError.message);
        // Continue with other files
      }
    }

    console.log(`✅ Uploaded ${uploadedURLs.length}/${(req.files as any[]).length} files`);

    if (uploadedURLs.length === 0) {
      console.error('❌ All file uploads failed');
      return res.status(500).json({ error: 'Failed to upload any files' });
    }

    res.json({
      success: true,
      urls: uploadedURLs,
      count: uploadedURLs.length,
      data: {
        urls: uploadedURLs, // Support both formats
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// Serve files from GridFS with Range header support for video streaming
router.get('/file/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { getGridFS } = require('../utils/gridfs');
    const gridfs = getGridFS();
    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;

    // Check if file exists
    const files = await gridfs.find({ _id: new ObjectId(fileId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    const fileSize = file.length;
    const contentType = file.contentType || 'application/octet-stream';
    const isVideo = contentType.startsWith('video/');

    // Handle Range header for video streaming
    const range = req.headers.range;
    
    if (range && isVideo) {
      // Parse Range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      console.log(`🎬 Streaming video chunk: ${start}-${end}/${fileSize}`);

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });

      // Stream the requested range
      const downloadStream = gridfs.openDownloadStream(new ObjectId(fileId), {
        start,
        end: end + 1,
      });

      downloadStream.pipe(res);

      downloadStream.on('error', (error: any) => {
        console.error('Error streaming video chunk:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
    } else {
      // No range header or not a video - serve full file
      res.set('Content-Type', contentType);
      res.set('Content-Length', String(fileSize));
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000');

      // Stream full file
      const downloadStream = gridfs.openDownloadStream(new ObjectId(fileId));
      downloadStream.pipe(res);

      downloadStream.on('error', (error: any) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
    }
  } catch (error: any) {
    console.error('File serve error:', error);
    res.status(500).json({ error: error.message || 'Failed to serve file' });
  }
});

export default router;


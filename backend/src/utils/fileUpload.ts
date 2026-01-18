import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to cloud storage)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log(`📁 Checking file: ${file.originalname}`);
  console.log(`   MIME type: ${file.mimetype}`);
  console.log(`   Field name: ${file.fieldname}`);
  
  // Be very permissive - accept all images and videos
  const isImage = file.mimetype.startsWith('image/') || 
                  file.mimetype === 'application/octet-stream' ||
                  /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i.test(file.originalname);
                  
  const isVideo = file.mimetype.startsWith('video/') || 
                  /\.(mp4|mov|mpeg|m4v)$/i.test(file.originalname);

  console.log(`   Is image: ${isImage}, Is video: ${isVideo}`);

  // Accept any image or video
  if (isImage || isVideo) {
    console.log(`✅ Accepted: ${file.originalname}`);
    return cb(null, true);
  } else {
    console.error(`❌ Rejected file: ${file.originalname} (mime: ${file.mimetype})`);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter,
});

// File upload utility functions
// Files are stored in MongoDB GridFS (see gridfs.ts)


import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure Multer (memory storage for direct S3 upload via buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Only allow common image/video formats for safety
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

const router = Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME || 'event-mgmt-swe-s3';
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').replace(/^"|"$/g, '').trim(),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').replace(/^"|"$/g, '').trim()
      }
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const fileExtension = path.extname(originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const objectKey = `uploads/${Date.now()}-${fileName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: mimetype
      // Removed ACL: 'public-read' because ACLs are disabled per best practices & instructions
    });

    await s3Client.send(uploadCommand);

    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${objectKey}`;

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: publicUrl
    });

  } catch (error: any) {
    console.error('Error uploading file to S3:', error);
    return res.status(500).json({
      error: 'Failed to upload file to S3',
      details: error.message
    });
  }
});

export default router;

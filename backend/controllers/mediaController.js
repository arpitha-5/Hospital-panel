import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Multer Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${req.user.hospitalId}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const uploadObject = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const { title } = req.body;
    
    // Construct local URL wrapper 
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    const media = await Media.create({
      hospitalId: req.user.hospitalId,
      uploaderId: req.user._id,
      url,
      title: title || 'Facility Image',
      fileName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedia = async (req, res) => {
  try {
    const media = await Media.find({ hospitalId: req.user.hospitalId })
      .populate('uploaderId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: media.length, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findOneAndDelete({ _id: req.params.id, hospitalId: req.user.hospitalId });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', 'uploads', media.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Image removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

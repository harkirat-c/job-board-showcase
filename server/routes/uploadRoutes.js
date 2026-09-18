import multer from 'multer';
import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => cb(null, /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype));
const resumeFilter = (req, file, cb) => cb(null, file.mimetype === 'application/pdf');

const uploadImage = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadResume = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: resumeFilter });

export default function uploadRoutes() {
    const router = Router();

    router.post('/image', uploadImage.single('image'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, GIF or WEBP.' });
        res.json({ url: `/uploads/${req.file.filename}` });
    });

    router.post('/resume', uploadResume.single('resume'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Invalid file type. Use PDF.' });
        res.json({ url: `/uploads/${req.file.filename}` });
    });

    return router;
}
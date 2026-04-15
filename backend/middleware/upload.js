////middleware/upload.js
// Multer configuration for local image uploads (offline-safe, no external CDN)
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    // e.g.  image-1713100000000.jpg
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /^image\//.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, webp, svg)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;

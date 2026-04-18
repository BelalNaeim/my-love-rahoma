const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = 'admin'; // Simple password for admin panel

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from root

// Setup multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'imgs', 'ras');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Helper function to read data
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ heroSubtitle: "", loveText: "", slides: [] }, null, 2));
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data:", err);
        return { heroSubtitle: "", loveText: "", slides: [] };
    }
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Get all content
app.get('/api/content', (req, res) => {
    res.json(readData());
});

// Update text content
app.post('/api/content/text', (req, res) => {
    const { password, heroSubtitle, loveText } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = readData();
    if (heroSubtitle !== undefined) data.heroSubtitle = heroSubtitle;
    if (loveText !== undefined) data.loveText = loveText;
    
    writeData(data);
    res.json({ success: true, message: 'Text updated successfully' });
});

// Add new slide
app.post('/api/content/slide', upload.single('image'), (req, res) => {
    const password = req.body.password;
    if (password !== ADMIN_PASSWORD) {
        if (req.file) fs.unlinkSync(req.file.path); // Delete uploaded file if unauthorized
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { caption } = req.body;
    
    if (!req.file && !req.body.imageUrl) {
         return res.status(400).json({ error: 'Image file or URL is required' });
    }

    const data = readData();
    
    let src = '';
    if (req.file) {
      // Relative path for frontend
      src = 'imgs/ras/' + req.file.filename;
    } else {
      src = req.body.imageUrl;
    }

    data.slides.push({
        src,
        caption: caption || ''
    });

    writeData(data);
    res.json({ success: true, slide: data.slides[data.slides.length - 1] });
});

// Delete a slide
app.delete('/api/content/slide/:index', (req, res) => {
    const password = req.body.password || req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const index = parseInt(req.params.index);
    const data = readData();

    if (index >= 0 && index < data.slides.length) {
        const slide = data.slides[index];
        // Optionally delete the image file if it's local
        if (slide.src.startsWith('imgs/')) {
            const filePath = path.join(__dirname, slide.src);
            if (fs.existsSync(filePath)) {
               try { fs.unlinkSync(filePath); } catch(e) { console.error("Could not delete file", e); }
            }
        }
        
        data.slides.splice(index, 1);
        writeData(data);
        res.json({ success: true, message: 'Slide deleted' });
    } else {
        res.status(404).json({ error: 'Slide not found' });
    }
});

// Update slide order / delete slide via replace
app.post('/api/content/slides', (req, res) => {
    const { password, slides } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = readData();
    if (Array.isArray(slides)) {
        data.slides = slides;
        writeData(data);
        res.json({ success: true, message: 'Slides updated successfully' });
    } else {
        res.status(400).json({ error: 'Invalid slides data' });
    }
});

// Main Page Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin Page Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;

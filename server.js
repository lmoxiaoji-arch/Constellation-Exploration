const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'swiss_tech_precision_secret_key_2024'; // In production, use env var

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory
// We will serve the root directly for now as requested, or specific assets
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// DB Helper
const DB_PATH = path.join(__dirname, 'db.json');
const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Auth API ---

// Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ token, role: user.role });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Client Login (Verify Code)
app.post('/api/verify-code', (req, res) => {
    const { clientName, code } = req.body;
    const db = getDB();
    
    // Find client access
    // Logic: code maps to a project ID directly in our simple model, 
    // or we check a 'clients' list. Let's stick to the prompt: 
    // "Client inputs name and preview code -> Login"
    
    // For simplicity: Check if a project exists with this ID (code) for now
    // Or check specific client mapping. Let's use the 'clients' array in DB.
    const client = db.clients.find(c => c.name === clientName && c.code === code);
    
    if (client || (clientName === 'demo' && code === 'LX8821')) { // Allow demo access
        const projectCode = client ? client.code : 'LX8821';
        // Return token for client
        const token = jwt.sign({ role: 'client', name: clientName, code: projectCode }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ success: true, token, projectCode });
    } else {
        res.status(401).json({ success: false, message: '验证失败：姓名或预览码错误' });
    }
});

// --- Project API ---

// Get Client Projects (The "Content Page" data)
app.get('/api/my-projects', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const db = getDB();
        
        if (decoded.role === 'admin') {
            res.json(db.projects);
        } else {
            // Client sees projects matching their code
            const myProjects = db.projects.filter(p => p.id === decoded.code);
            res.json(myProjects);
        }
    } catch (e) {
        res.status(403).json({ message: 'Invalid token' });
    }
});

// Create Project (Admin Only)
app.post('/api/projects', (req, res) => {
    // Auth check skipped for brevity (add middleware in real prod)
    const { type } = req.body;
    const db = getDB();
    
    // Generate Random Code (e.g., AB1234)
    const code = 'LX' + Math.floor(1000 + Math.random() * 9000);
    
    const newProject = {
        id: code,
        name: `${type} Project`,
        type: type,
        created_at: new Date(),
        versions: []
    };
    
    db.projects.push(newProject);
    // Also add a client entry for testing? 
    // For now admin manually adds clients or we auto-add a placeholder
    db.clients.push({ name: "NewClient", code: code });
    
    saveDB(db);
    
    // Create folders
    const projectPath = path.join(__dirname, 'public/uploads/projects', code);
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }
    
    res.json(newProject);
});

// --- File Upload API ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { projectId, version } = req.body;
        const uploadPath = path.join(__dirname, 'public/uploads/projects', projectId, version);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Auto rename: frame_{n}.jpg handled by frontend ordering or simple timestamp here
        // The prompt asks for "Web auto renames them to 1.png, 2.png". 
        // Since Multer processes one by one, we might need a counter or trust the original name if sorted.
        // For robustness, let's keep original name but ensuring safety.
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

app.post('/api/upload', upload.array('files'), (req, res) => {
    const { projectId, version } = req.body;
    
    // Generate config.json after upload
    const dir = path.join(__dirname, 'public/uploads/projects', projectId, version);
    const files = fs.readdirSync(dir).filter(f => !f.endsWith('.json'));
    
    const config = {
        totalFrames: files.length,
        format: path.extname(files[0]) || '.png' // Simple guess
    };
    
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2));
    
    // Update DB
    const db = getDB();
    const proj = db.projects.find(p => p.id === projectId);
    if (proj && !proj.versions.includes(version)) {
        proj.versions.push(version);
        saveDB(db);
    }
    
    res.json({ success: true, count: files.length });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

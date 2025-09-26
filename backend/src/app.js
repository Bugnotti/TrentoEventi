import express from "express";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define potential paths for the frontend build
const potentialPaths = [
  join(__dirname, '../../frontend/dist'),
  join(__dirname, '../frontend/dist'),
  join(__dirname, '../../dist'),
  join(__dirname, '../dist')
];

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Find the correct frontend build path
let frontendPath = null;
console.log('🔍 Searching for frontend build files...');
for (const path of potentialPaths) {
  console.log(`   Checking: ${path} - ${existsSync(path) ? '✅ Found' : '❌ Not found'}`);
  if (existsSync(path)) {
    frontendPath = path;
    break;
  }
}

if (frontendPath) {
  console.log(`📁 Frontend build found at: ${frontendPath}`);
} else {
  console.log('❌ No frontend build directory found');
}

if (frontendPath) {
  // Serve static files from frontend build
  app.use(express.static(frontendPath));
  
  // Catch-all handler: send back index.html file for any other route
  app.get('*', (req, res) => {
    res.sendFile(join(frontendPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving frontend file:', err);
        res.status(404).json({ error: 'Frontend file not found' });
      }
    });
  });
} else {
  // If no frontend build is found, just serve a simple response for the root
  app.get('/', (req, res) => {
    res.json({ 
      message: 'TrentoEventi API is running',
      status: 'Backend is running but frontend build not found. Contact administrator.',
      api: 'Available at /api/* routes'
    });
  });
  
  // For non-root routes, return 404
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

export default app;

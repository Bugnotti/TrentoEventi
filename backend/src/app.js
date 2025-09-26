import express from "express";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug middleware to track API requests
app.use("/api", (req, res, next) => {
  console.log(`🔍 API request: ${req.method} ${req.originalUrl}`);
  next();
});

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Debug logging
console.log('🔍 Server startup debug:');
console.log('   Current directory:', process.cwd());
console.log('   Backend directory:', __dirname);
console.log('   Parent directory:', dirname(__dirname));

// Define potential paths for the frontend build - check different deployment scenarios
const potentialPaths = [
  // Render.com specific path - this is where the frontend actually gets built!
  join(process.cwd(), '../frontend/dist'),
  // Common monorepo structures
  join(__dirname, '../../frontend/dist'),
  join(__dirname, '../frontend/dist'),
  join(__dirname, '../../dist'),
  join(__dirname, '../dist'),
  join(__dirname, 'frontend/dist'),
  // Render.com deployment paths
  join(process.cwd(), 'frontend/dist'),
  join(process.cwd(), 'dist'),
  join(process.cwd(), '../frontend/dist'),
  // Render.com specific paths based on cwd: /opt/render/project/src/backend
  join(process.cwd(), '../../frontend/dist'),
  join(process.cwd(), '../../../frontend/dist'),
  join(process.cwd(), '../../dist'),
  join(process.cwd(), '../../../dist'),
  // Current directory built-in scenarios
  join(process.cwd(), 'dist'),
  join(process.cwd(), 'frontend/dist'),
  join(__dirname, 'dist')
];

// Also search recursively for dist directory
function findDistDirectory(startPath, maxDepth = 3, currentDepth = 0) {
  const found = [];
  try {
    const entries = readdirSync(startPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === 'dist') {
          found.push(join(startPath, entry.name));
        }
        if (currentDepth < maxDepth) {
          found.push(...findDistDirectory(join(startPath, entry.name), maxDepth, currentDepth + 1));
        }
      }
    }
  } catch (err) {
    // Directory can't be read, skip
  }
  return found;
}

// Find the correct frontend build path
let frontendPath = null;
console.log('🔍 Searching for frontend build files...');
console.log('   Current working directory:', process.cwd());
console.log('   Backend source directory:', __dirname);

for (const path of potentialPaths) {
  const exists = existsSync(path);
  console.log(`   Checking: ${path} - ${exists ? '✅ Found' : '❌ Not found'}`);
  if (exists && !frontendPath) {
    frontendPath = path;
    console.log(`   ✅ Selected frontend path: ${frontendPath}`);
  }
}

// If not found in predefined paths, search recursively
if (!frontendPath) {
  console.log('   Searching recursively...');
  const recursivePaths = findDistDirectory(process.cwd());
  for (const path of recursivePaths) {
    console.log(`   Found dist directory: ${path}`);
    if (!frontendPath && existsSync(join(path, 'index.html'))) {
      frontendPath = path;
      console.log(`   ✅ Found frontend build at: ${frontendPath}`);
      break;
    }
  }
}

// Additional fallback: check if frontend was built in the project root
if (!frontendPath) {
  console.log('   Checking project root for frontend build...');
  const projectRoot = process.cwd().replace('/src/backend', '');
  const rootDistPath = join(projectRoot, 'frontend/dist');
  console.log(`   Checking project root: ${rootDistPath}`);
  console.log(`   Project root exists: ${existsSync(rootDistPath)}`);
  if (existsSync(rootDistPath) && existsSync(join(rootDistPath, 'index.html'))) {
    frontendPath = rootDistPath;
    console.log(`   ✅ Found frontend build at project root: ${frontendPath}`);
  } else {
    console.log(`   ❌ Project root frontend not found at: ${rootDistPath}`);
  }
}

// Final fallback: check the exact path where Render builds the frontend
if (!frontendPath) {
  console.log('   Checking Render.com specific frontend path...');
  const renderFrontendPath = join(process.cwd(), '../frontend/dist');
  console.log(`   Checking: ${renderFrontendPath}`);
  console.log(`   Path exists: ${existsSync(renderFrontendPath)}`);
  if (existsSync(renderFrontendPath)) {
    console.log(`   Directory contents: ${readdirSync(renderFrontendPath).join(', ')}`);
  }
  if (existsSync(renderFrontendPath) && existsSync(join(renderFrontendPath, 'index.html'))) {
    frontendPath = renderFrontendPath;
    console.log(`   ✅ Found frontend build at Render path: ${frontendPath}`);
  } else {
    console.log(`   ❌ Frontend build not found at: ${renderFrontendPath}`);
  }
}

if (frontendPath) {
  console.log(`📁 Frontend build found at: ${frontendPath}`);
} else {
  console.log('❌ No frontend build directory found');
}

if (frontendPath) {
  console.log(`📁 Frontend build found at: ${frontendPath}`);
  // Serve static files from frontend build
  app.use(express.static(frontendPath));
  
  // Catch-all handler: send back index.html file for any other route
  // IMPORTANT: Only handle non-API routes here
  app.use((req, res, next) => {
    // Skip API routes - let them be handled by the API middleware
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const indexPath = join(frontendPath, 'index.html');
    console.log(`Serve index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving frontend file:', err);
        res.status(404).json({ 
          error: 'Frontend file not found', 
          path: indexPath,
          debug: frontendPath 
        });
      }
    });
  });
} else {
  console.log('❌ No frontend build directory found - serving API only');
  
  // Serve root path for API info when no frontend
  app.get('/', (req, res) => {
    console.log('Root path requested - serving API info');
    res.json({ 
      message: 'TrentoEventi API is running',
      status: 'Backend is running but frontend build not found',
      api: 'Available at /api/* routes',
      debug: {
        cwd: process.cwd(),
        backend_path: __dirname,
        potentialPaths: potentialPaths.slice(0, 5) // Show first 5 paths checked
      }
    });
  });
  
  // Handle all other routes for non-frontend deployments  
  app.use((req, res) => {
    console.log(`404 requested for path: ${req.path}`);
    res.status(404).json({ 
      error: 'Route not found',
      path: req.path,
      available: '/api/* routes'
    });
  });
}

export default app;

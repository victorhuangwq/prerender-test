const express = require('express');
const fs = require('fs');
const path = require('path');

const TEST_DIR = __dirname;

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function readHeadersFile(headerFilePath) {
  const headers = {};

  if (fs.existsSync(headerFilePath)) {
    try {
      const headerContent = fs.readFileSync(headerFilePath, 'utf8');
      const lines = headerContent.split('\n');

      lines.forEach(line => {
        line = line.trim();
        if (line && line.includes(':')) {
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();

          if (key && value) {
            headers[key] = value;
          }
        }
      });
    } catch (err) {
      console.error(`Error reading headers file: ${err.message}`);
    }
  }

  return headers;
}

function createApp(serverName) {
  const app = express();

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // Cache control headers
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // CSP for cross-site server (site-b.example:8081)
  if (serverName === 'cross-site') {
    app.use((req, res, next) => {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://site-a.test:8080 http://site-c.localhost:8082");
      next();
    });
  }

  // CSP for nested cross-site server (site-c.localhost:8082)
  if (serverName === 'nested-cross-site') {
    app.use((req, res, next) => {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://site-a.test:8080");
      next();
    });
  }

  // Custom headers from .headers files middleware
  app.use((req, res, next) => {
    const pathname = req.path;
    const filePath = path.join(TEST_DIR, pathname);

    // Security: Prevent directory traversal
    if (!filePath.startsWith(TEST_DIR)) {
      return res.status(403).send('403 Forbidden');
    }

    // Try to read custom headers from .headers file for this request
    const customHeaders = readHeadersFile(filePath + '.headers');
    Object.entries(customHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    next();
  });

  // Serve static files
  app.use(express.static(TEST_DIR));

  // 404 handler
  app.use((req, res) => {
    res.status(404).send('404 Not Found');
  });

  return app;
}

// Create all servers
const app8080 = createApp('main');
const app8081 = createApp('cross-site');
const app8082 = createApp('nested-cross-site');

// Start server on port 8080 (main origin - serves page-a, page-b)
const server8080 = app8080.listen(8080, () => {
  console.log('Server 1 running at http://site-a.test:8080/ (main origin)');
});

// Start server on port 8081 (cross-site - serves iframe-content)
const server8081 = app8081.listen(8081, () => {
  console.log('Server 2 running at http://site-b.example:8081/ (cross-site iframe)');
});

// Start server on port 8082 (nested cross-site - serves page-c)
const server8082 = app8082.listen(8082, () => {
  console.log('Server 3 running at http://site-c.localhost:8082/ (nested cross-site)');
});

// Handle errors
server8080.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: Port 8080 is already in use');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server8081.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: Port 8081 is already in use');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server8082.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: Port 8082 is already in use');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  server8080.close(() => {
    server8081.close(() => {
      server8082.close(() => {
        console.log('Servers closed');
        process.exit(0);
      });
    });
  });
});

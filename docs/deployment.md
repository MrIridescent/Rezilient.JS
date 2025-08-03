# Aether.js Deployment Guide

Deploy your **Resilient-First** applications to production with confidence.

## 🎯 **Deployment Overview**

Aether.js applications are designed for **universal deployment** - they work seamlessly across all platforms and hosting environments while maintaining their offline-first capabilities.

### **Key Deployment Benefits**

- 🌐 **Universal Compatibility** - Single codebase runs everywhere
- ⚡ **Instant Loading** - Service Worker caching for sub-second loads
- 📱 **Progressive Web App** - Installable on all devices
- 🛡️ **Offline Resilience** - Works without network connectivity
- 🔄 **Automatic Updates** - Seamless background updates

---

## 🏗️ **Build Process**

### **Production Build**

```bash
# Build for production
npm run build

# Build output structure
dist/
├── index.html          # Main application entry
├── assets/
│   ├── main.js         # Bundled application code
│   ├── main.css        # Compiled styles
│   └── vendor.js       # Third-party dependencies
├── sw.js              # Service Worker
├── manifest.json      # PWA manifest
└── icons/             # App icons for different platforms
```

### **Build Configuration**

Create `vite.config.js` for optimal Aether.js builds:

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.yourapp\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Your Aether.js App',
        short_name: 'AetherApp',
        description: 'Resilient-First Application',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['aether-framework'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
});
```

---

## 🌐 **Hosting Platforms**

### **1. Vercel (Recommended)**

Perfect for Aether.js applications with automatic PWA optimization.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "Service-Worker-Allowed": "/"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### **2. Netlify**

Excellent for static Aether.js applications.

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Configure netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Service-Worker-Allowed = "/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **3. Firebase Hosting**

Great for applications needing Firebase backend integration.

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Initialize
firebase init hosting

# Configure firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          }
        ]
      }
    ]
  }
}

# Deploy
firebase deploy
```

### **4. GitHub Pages**

Free hosting for open-source Aether.js projects.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 🐳 **Docker Deployment**

For containerized deployments and enterprise environments.

### **Dockerfile**

```dockerfile
# Multi-stage build for optimal size
FROM node:16-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx for PWA
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **nginx.conf**

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Service Worker headers
        location /sw.js {
            add_header Service-Worker-Allowed /;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # PWA manifest
        location /manifest.json {
            add_header Cache-Control "public, max-age=86400";
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### **Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  aether-app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  # Optional: Add backend services
  api:
    image: your-api-image
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
```

---

## ⚡ **Performance Optimization**

### **Service Worker Optimization**

```javascript
// sw.js - Optimized service worker
const CACHE_NAME = 'aether-app-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/main.js',
        '/assets/main.css',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Stale While Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  }
  
  // Static assets - Cache First
  else if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      })
    );
  }
  
  // HTML - Network First with fallback
  else if (request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
  }
});
```

### **Bundle Optimization**

```javascript
// vite.config.js - Advanced optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'aether-core': ['aether-framework'],
          'vendor-ui': ['react', 'react-dom'],
          'vendor-utils': ['lodash', 'date-fns']
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'es2020'
  },
  // Code splitting for lazy loading
  experimental: {
    renderBuiltUrl(filename) {
      return `https://cdn.yourapp.com/${filename}`;
    }
  }
});
```

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**

```javascript
// Performance tracking for Aether.js apps
class AetherAnalytics {
  constructor() {
    this.metrics = {
      loadTime: 0,
      offlineTime: 0,
      syncEvents: 0,
      errors: []
    };
    
    this.setupPerformanceTracking();
    this.setupOfflineTracking();
  }

  setupPerformanceTracking() {
    // Track app load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.loadTime = loadTime;
      this.sendMetric('app_load_time', loadTime);
    });

    // Track Service Worker performance
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'CACHE_HIT') {
        this.sendMetric('cache_hit', event.data.url);
      }
    });
  }

  setupOfflineTracking() {
    let offlineStart = null;

    window.addEventListener('offline', () => {
      offlineStart = Date.now();
      this.sendMetric('went_offline');
    });

    window.addEventListener('online', () => {
      if (offlineStart) {
        const offlineTime = Date.now() - offlineStart;
        this.metrics.offlineTime += offlineTime;
        this.sendMetric('came_online', { duration: offlineTime });
      }
    });
  }

  sendMetric(event, data) {
    // Send to your analytics service
    if (navigator.onLine) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: Date.now() })
      }).catch(console.error);
    }
  }
}

// Initialize analytics
const analytics = new AetherAnalytics();
```

### **Error Tracking**

```javascript
// Error boundary for Aether.js applications
class AetherErrorBoundary {
  constructor() {
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', event => {
      this.logError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', event => {
      this.logError('unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Service Worker errors
    navigator.serviceWorker.addEventListener('error', event => {
      this.logError('service_worker_error', {
        message: event.message,
        filename: event.filename
      });
    });
  }

  logError(type, details) {
    const errorData = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      offline: !navigator.onLine
    };

    // Store locally if offline
    if (!navigator.onLine) {
      this.storeErrorLocally(errorData);
    } else {
      this.sendErrorToService(errorData);
    }
  }

  storeErrorLocally(errorData) {
    const errors = JSON.parse(localStorage.getItem('aether_errors') || '[]');
    errors.push(errorData);
    localStorage.setItem('aether_errors', JSON.stringify(errors));
  }

  async sendErrorToService(errorData) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (error) {
      this.storeErrorLocally(errorData);
    }
  }
}

// Initialize error tracking
const errorBoundary = new AetherErrorBoundary();
```

---

## 🔒 **Security Considerations**

### **Content Security Policy**

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourapp.com;
  worker-src 'self';
">
```

### **HTTPS Enforcement**

```javascript
// Enforce HTTPS in production
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

---

**Next:** [Migration Guide](./migration.md) | [API Reference](./api-reference.md)

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/presentation/apiRoutes.js';
import { db } from './server/infrastructure/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with ample limit for optimized image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      name: 'Malasban Lavashak Platform API',
    });
  });

  // SEO: Dynamic Robots.txt
  app.get('/robots.txt', (req, res) => {
    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send([
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /checkout',
      'Disallow: /account',
      '',
      `Sitemap: ${appUrl}/sitemap.xml`,
    ].join('\r\n'));
  });

  // SEO: Dynamic Sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const staticPages = ['', '/shop', '/wholesale', '/blog', '/about', '/contact', '/faq'];
    const productUrls = db.products.map((p) => `/products/${p.slug}`);
    const blogUrls = db.blogPosts.map((b) => `/blog/${b.slug}`);

    const allUrls = [...staticPages, ...productUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${appUrl}${u}</loc>
    <changefreq>daily</changefreq>
    <priority>${u === '' ? '1.0' : u.startsWith('/products') ? '0.9' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Global Error Handler for API
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'Server error',
    });
  });

  // Vite Middleware for SPA Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Malasban Lavashak Server] Running at http://localhost:${PORT}`);
    try {
      const pgLoaded = await db.initFromPostgres();
      if (pgLoaded) {
        console.log('[PostgreSQL Engine] Application data successfully initialized from PostgreSQL database.');
      } else {
        console.log('[Database] Engine ready. PostgreSQL connection available via DATABASE_URL or .env config.');
      }
    } catch {
      // Non-blocking fallback
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

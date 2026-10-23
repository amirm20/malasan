import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/presentation/apiRoutes.js';
import { db } from './server/infrastructure/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable('x-powered-by');
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.APP_URL || !process.env.APP_URL.startsWith('https://')) {
      throw new Error('APP_URL must be configured with the public HTTPS URL in production.');
    }
    app.set('trust proxy', 1);
  }

  // Baseline browser security headers (Helmet can replace this middleware later).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Product images should be uploaded to object storage, not sent as huge JSON bodies.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Cookie-authenticated state changes must originate from this site.
  app.use('/api', (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'درخواست فاقد مبدأ معتبر است.' });
      }
      return next();
    }
    try {
      const expectedOrigin = process.env.APP_URL
        ? new URL(process.env.APP_URL).origin
        : `${req.protocol}://${req.get('host')}`;
      if (new URL(origin).origin !== expectedOrigin) {
        return res.status(403).json({ message: 'مبدأ درخواست مجاز نیست.' });
      }
    } catch {
      return res.status(403).json({ message: 'مبدأ درخواست نامعتبر است.' });
    }
    next();
  });

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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
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

  // Do not accept requests until PostgreSQL is connected and application data is loaded.
  await db.initFromPostgres();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Malasban Lavashak Server] Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exitCode = 1;
});

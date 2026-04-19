import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
fs.ensureDirSync(DOWNLOADS_DIR);

const activeDownloads = new Map<string, {
  id: string;
  url: string;
  filename: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  size: number;
  downloaded: number;
  error?: string;
}>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/files', async (req, res) => {
    try {
      const files = await fs.readdir(DOWNLOADS_DIR);
      const fileInfos = await Promise.all(files.map(async (file) => {
        const stats = await fs.stat(path.join(DOWNLOADS_DIR, file));
        return {
          name: file,
          size: stats.size,
          mtime: stats.mtime,
          type: mime.lookup(file) || 'application/octet-stream',
        };
      }));
      res.json(fileInfos);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      const downloadId = Math.random().toString(36).substring(7);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded_file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      } else {
        const urlParts = url.split('/');
        filename = urlParts[urlParts.length - 1] || 'file';
      }

      // Handle duplicate filenames
      let finalFilename = filename;
      let counter = 1;
      while (await fs.pathExists(path.join(DOWNLOADS_DIR, finalFilename))) {
        const ext = path.extname(filename);
        const name = path.basename(filename, ext);
        finalFilename = `${name}_${counter}${ext}`;
        counter++;
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      const downloadInfo = {
        id: downloadId,
        url,
        filename: finalFilename,
        progress: 0,
        status: 'downloading' as const,
        size: totalSize,
        downloaded: 0,
      };
      
      activeDownloads.set(downloadId, downloadInfo);

      const writer = fs.createWriteStream(path.join(DOWNLOADS_DIR, finalFilename));
      let downloaded = 0;

      response.data.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        const progress = totalSize ? Math.floor((downloaded / totalSize) * 100) : 0;
        activeDownloads.set(downloadId, {
          ...downloadInfo,
          downloaded,
          progress,
        });
      });

      response.data.pipe(writer);

      writer.on('finish', () => {
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId)!,
          status: 'completed',
          progress: 100,
        });
        // Remove from active downloads after some time
        setTimeout(() => activeDownloads.delete(downloadId), 30000);
      });

      writer.on('error', (err) => {
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId)!,
          status: 'error',
          error: err.message,
        });
        setTimeout(() => activeDownloads.delete(downloadId), 60000);
      });

      res.json({ id: downloadId, filename: finalFilename });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate download' });
    }
  });

  app.get('/api/downloads/active', (req, res) => {
    res.json(Array.from(activeDownloads.values()));
  });

  app.delete('/api/files/:name', async (req, res) => {
    const { name } = req.params;
    try {
      const filePath = path.join(DOWNLOADS_DIR, name);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  app.get('/api/files/download/:name', async (req, res) => {
    const { name } = req.params;
    const filePath = path.join(DOWNLOADS_DIR, name);
    if (await fs.pathExists(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      res.json({
        memory: {
          total: totalMem,
          free: freeMem,
          used: totalMem - freeMem,
          usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
        },
        cpu: {
          model: cpus[0].model,
          cores: cpus.length,
          loadAvg: loadAvg[0],
        },
        uptime: os.uptime(),
        platform: os.platform(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

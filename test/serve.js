import { promises as fs } from 'node:fs';
import http from 'node:http';
import { extname } from 'node:path';

import './build.js';

const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ttf': 'font/ttf',
};

http
  .createServer(async (req, res) => {
    const file = req.url === '/' ? 'index.html' : req.url.slice(1);
    const url = new URL(file, import.meta.url);
    const ext = extname(url.pathname);
    try {
      const content = await fs.readFile(url);
      res.setHeader('Content-type', contentTypes[ext] ?? 'text/plain');
      res.end(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, 'Not Found');
      } else {
        res.writeHead(500, 'Internal server error');
      }
      res.end(String(err));
    }
  })
  // eslint-disable-next-line no-console
  .listen(3000, () => console.log('listening...'));

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version?: string }
const appVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    {
      name: 'dev-favicon',
      enforce: 'pre',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url !== '/favicon.svg') return next();
          try {
            const iconPath = path.resolve(__dirname, 'public', 'favicon-dev.svg');
            const svg = fs.readFileSync(iconPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'no-store');
            res.end(svg);
          } catch {
            next();
          }
        });
      }
    },
    react(),
    checker({
      typescript: {
        buildMode: true,
      },
    }),
    {
      name: 'feedback-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/feedback' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const feedbackFile = path.resolve(__dirname, 'feedback.txt');

                const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
                const logEntry = `
========================================
[${timestamp}] FEEDBACK ENTRY
----------------------------------------
Section/Exercise: ${data.section || 'N/A'}
Question:         ${data.question || 'N/A'}
Correct Answer:   ${data.correctAnswer || 'N/A'}
User Answer:      ${data.userAnswer || 'N/A'}
Notes/Issues:
${data.notes || 'N/A'}
========================================
`;
                fs.appendFileSync(feedbackFile, logEntry, 'utf8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Feedback saved successfully!' }));
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})

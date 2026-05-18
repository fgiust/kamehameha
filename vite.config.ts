import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
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
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
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

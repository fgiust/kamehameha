import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTranslateSessionTxt } from './src/lessons/parseTranslateSessionTxt'
import { parseReadingExerciseTxt } from './src/lessons/parseReadingExerciseTxt'
import { updateTranslateBlockInFile } from './src/lessons/updateTranslateBlockInFile'
import { isEditableSentenceDataFile } from './src/lessons/lessonDataFile'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version?: string }
const appVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0'

function genkiTxtPlugin(): Plugin {
  const virtualModuleId = 'virtual:genki-txt-lessons'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  const dataDir = path.resolve(__dirname, 'src/data')

  return {
    name: 'vite-plugin-genki-txt',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        // Read all txt files in src/data
        const files = fs
          .readdirSync(dataDir)
          .filter(f =>
            /^genki-\d{2}-\d\.txt$/i.test(f) ||
            /^sentence-[a-z0-9-]+\.txt$/i.test(f) ||
            /^reading-[a-z0-9-]+\.txt$/i.test(f)
          )
        
        const genkiDescriptors: {
          file: string
          sessionId: string
          text: string
          lesson: number
          exercise: number
          filePath: string
        }[] = []
        const sentenceDescriptors: {
          file: string
          sessionId: string
          text: string
          filePath: string
        }[] = []
        const readingDescriptors: {
          file: string
          sessionId: string
          text: string
          filePath: string
        }[] = []

        for (const file of files) {
          const filePath = path.join(dataDir, file)
          const text = fs.readFileSync(filePath, 'utf-8')

          // We add this file to watch list so Vite knows to re-run this load hook when it changes
          this.addWatchFile(filePath)

          const genkiMatch = /^genki-(\d{2})-(\d)\.txt$/i.exec(file)
          if (genkiMatch) {
            const lesson = Number(genkiMatch[1])
            const exercise = Number(genkiMatch[2])
            const sessionId = `genki${lesson}-${exercise}`
            genkiDescriptors.push({ file, sessionId, text, lesson, exercise, filePath })
            continue
          }

          const sentenceMatch = /^(sentence-[a-z0-9-]+)\.txt$/i.exec(file)
          if (sentenceMatch) {
            const sessionId = sentenceMatch[1]
            sentenceDescriptors.push({ file, sessionId, text, filePath })
            continue
          }

          const readingMatch = /^(reading-[a-z0-9-]+)\.txt$/i.exec(file)
          if (readingMatch) {
            const sessionId = readingMatch[1]
            readingDescriptors.push({ file, sessionId, text, filePath })
          }
        }

        genkiDescriptors.sort((a, b) => (a.lesson - b.lesson) || (a.exercise - b.exercise))
        sentenceDescriptors.sort((a, b) => a.sessionId.localeCompare(b.sessionId))
        readingDescriptors.sort((a, b) => a.sessionId.localeCompare(b.sessionId))

        const parsedGenkiLessons = genkiDescriptors.map(desc => {
          // This will THROW at build/dev time if the format is invalid, caught directly by Vite!
          return parseTranslateSessionTxt({
            id: desc.sessionId,
            text: desc.text,
            sourceName: desc.filePath
          })
        })

        const parsedSentenceLessons = sentenceDescriptors.map(desc => {
          // This will THROW at build/dev time if the format is invalid, caught directly by Vite!
          return parseTranslateSessionTxt({
            id: desc.sessionId,
            text: desc.text,
            sourceName: desc.filePath
          })
        })

        const parsedReadingLessons = readingDescriptors.map(desc => {
          return parseReadingExerciseTxt({
            id: desc.sessionId,
            text: desc.text,
            sourceName: desc.filePath
          })
        })

        return [
          `export const genkiTxtLessons = ${JSON.stringify(parsedGenkiLessons, null, 2)};`,
          `export const sentenceTxtLessons = ${JSON.stringify(parsedSentenceLessons, null, 2)};`,
          `export const readingTxtLessons = ${JSON.stringify(parsedReadingLessons, null, 2)};`,
          ''
        ].join('\n')
      }
    }
  }
}

const tenshinRoot = path.resolve(__dirname, 'packages/tenshindiff');

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: 'tenshindiff/validate', replacement: path.resolve(tenshinRoot, 'src/validate/index.ts') },
      { find: 'tenshindiff/react', replacement: path.resolve(tenshinRoot, 'src/react/index.ts') },
      { find: 'tenshindiff/styles.css', replacement: path.resolve(tenshinRoot, 'src/react/styles.css') },
      { find: 'tenshindiff', replacement: path.resolve(tenshinRoot, 'src/index.ts') },
    ],
  },
  test: {
    include: ['test/**/*.test.ts', 'packages/tenshindiff/test/**/*.test.ts'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    genkiTxtPlugin(),
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
      name: 'dev-sentence-edit-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url !== '/api/dev/sentence-block' || req.method !== 'POST') {
            next();
            return;
          }
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body) as {
                fileName?: string;
                blockIndex?: number;
                english?: string;
                italian?: string;
                answer?: string;
              };
              const fileName = data.fileName ?? '';
              if (!isEditableSentenceDataFile(fileName)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid file name' }));
                return;
              }
              const blockIndex = data.blockIndex;
              if (typeof blockIndex !== 'number' || blockIndex < 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Invalid block index' }));
                return;
              }
              updateTranslateBlockInFile({
                dataDir: path.resolve(__dirname, 'src/data'),
                fileName,
                blockIndex,
                english: data.english ?? '',
                italian: data.italian ?? '',
                answer: data.answer ?? '',
              });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Unknown error';
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: message }));
            }
          });
        });
      },
    },
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
ID/URL:           ${data.exerciseId || 'N/A'}
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

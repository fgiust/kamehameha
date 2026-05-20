import fs from 'fs';
const content = fs.readFileSync('./src/data/genki01.ts', 'utf-8');
const lessonRegex = /id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*sentenceData:\s*\[([\s\S]*?)\]/g;
let match;
while ((match = lessonRegex.exec(content)) !== null) {
  console.log('Found lesson:', match[1], match[2]);
  const sentences = match[3];
  const sentenceRegex = /english:\s*['"`](.*?)['"`],\s*answer:\s*['"`](.*?)['"`]/g;
  let sMatch;
  let count = 0;
  while ((sMatch = sentenceRegex.exec(sentences)) !== null) {
    count++;
  }
  console.log('Sentences:', count);
}

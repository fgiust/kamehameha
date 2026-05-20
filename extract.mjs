import fs from 'fs';
import translate from 'google-translate-api-x';
import path from 'path';

async function run() {
  for (let i = 1; i <= 23; i++) {
    const fileNum = i.toString().padStart(2, '0');
    const tsFile = `./src/data/genki${fileNum}.ts`;
    if (!fs.existsSync(tsFile)) continue;

    console.log(`Processing ${tsFile}...`);
    const content = fs.readFileSync(tsFile, 'utf-8');

    // Updated regex to handle trailing commas
    const lessonRegex = /{\s*id:\s*['"`](genki\d+-\d+)['"`],\s*title:\s*['"`](.*?)['"`],\s*sentenceData:\s*\[([\s\S]*?)\]\s*,?\s*}/g;
    let match;
    while ((match = lessonRegex.exec(content)) !== null) {
      const id = match[1];
      const title = match[2];
      const sentencesText = match[3];

      const sentenceRegex = /{\s*english:\s*(['"`])([\s\S]*?)\1,\s*answer:\s*(['"`])([\s\S]*?)\3\s*,?\s*}/g;
      const sentences = [];
      let sMatch;
      while ((sMatch = sentenceRegex.exec(sentencesText)) !== null) {
        sentences.push({
          english: sMatch[2].replace(/\\'/g, "'"),
          answer: sMatch[4].replace(/\\'/g, "'")
        });
      }

      console.log(`  Found lesson: ${id} with ${sentences.length} sentences`);

      if (sentences.length === 0) continue;

      const parts = id.match(/genki(\d+)-(\d+)/);
      const lessonNum = parts[1].padStart(2, '0');
      const exerciseNum = parts[2];
      const outFileName = `genki-${lessonNum}-${exerciseNum}.txt`;
      const outFilePath = `./src/data/${outFileName}`;

      if (fs.existsSync(outFilePath)) {
        console.log(`  File ${outFileName} already exists, skipping...`);
        continue;
      }

      console.log(`    Translating...`);
      let titleIt = title;
      try {
        const res = await translate(title, { to: 'it' });
        titleIt = res.text;
      } catch (e) {
        console.error('Translation error', e);
      }

      let outTxt = `${title}\n${titleIt}\n`;

      for (const s of sentences) {
        let it = s.english;
        try {
          const res = await translate(s.english, { to: 'it' });
          it = res.text;
        } catch (e) {}

        outTxt += `\n${s.english}\n${it}\n${s.answer}\n`;
      }

      fs.writeFileSync(outFilePath, outTxt, 'utf-8');
      console.log(`    Saved ${outFileName}`);
    }
  }
}

run();

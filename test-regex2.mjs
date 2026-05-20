const txt = `      { english: 'How much is that over there?', answer: 'あれは{いくら|なん円[えん]}{ですか|か}' },`;
const regex = /{\s*english:\s*(['"`])([\s\S]*?)\1,\s*answer:\s*(['"`])([\s\S]*?)\3\s*}/g;
let m;
while(m = regex.exec(txt)) {
  console.log(m[2]);
}

import translate from 'google-translate-api-x';

async function test() {
  const res = await translate('Hello world', { to: 'it' });
  console.log(res.text);
}
test();

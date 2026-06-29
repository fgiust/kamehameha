import { spawn } from 'node:child_process';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Missing Supabase CLI arguments.');
  process.exit(1);
}

const child = spawn('supabase', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', error => {
  if (error && 'code' in error && error.code === 'ENOENT') {
    console.error([
      'Supabase CLI not found.',
      'Install it first: https://supabase.com/docs/guides/local-development/cli/getting-started',
      'Then run:',
      '  npm run db:link -- --project-ref <your-project-ref>',
      '  npm run db:migrate',
    ].join('\n'));
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : 'Failed to start Supabase CLI.');
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

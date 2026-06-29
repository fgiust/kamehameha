# Supabase migrations

This project uses versioned SQL migrations stored in `supabase/migrations`.

## First-time setup

1. Install the Supabase CLI.
2. Link this repo to the remote project:

```bash
npm run db:link -- --project-ref <your-project-ref>
```

3. Apply all pending migrations:

```bash
npm run db:migrate
```

## Useful commands

```bash
npm run db:status
npm run db:new -- <migration_name>
```

## Notes

- `db:migrate` applies the SQL files in `supabase/migrations` to the linked project.
- If the app reports that the schema is not initialized, run `npm run db:migrate`.

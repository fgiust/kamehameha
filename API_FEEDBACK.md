# Feedback API (Local + Vercel)

This project supports two different implementations for the same endpoint:

- Local development (`npm run dev`): appends feedback entries to `feedback.txt` on disk (Vite dev middleware).
- Production on Vercel: stores feedback entries in Supabase Postgres and provides an export endpoint to download them as a `.txt` file.

## Environment variables (Vercel)

Required for Supabase storage:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended for export privacy (acts like a “secret URL”):

- `FEEDBACK_EXPORT_KEY`

If `FEEDBACK_EXPORT_KEY` is set, the export endpoint returns 404 unless you pass the correct `?key=...` query parameter.

Before using feedback storage on Vercel, make sure the database migrations have been applied:

- `npm run db:migrate`

## Endpoints

### POST `/api/feedback`

Stores a feedback entry.

Request body (JSON):

- `section` (string)
- `question` (string)
- `correctAnswer` (string)
- `userAnswer` (string)
- `notes` (string)

Response (JSON):

- `{ "success": true, "message": "Feedback saved successfully!" }`

### GET `/api/feedback`

By default, this endpoint does not download anything. To download the export file you must pass `?download=1`.

When `download=1` is present, it downloads a text file containing feedback entries in the same format used by `feedback.txt`.

The downloaded filename format is:

- `feedback.YYYY-MM-DD-HH-mm.txt` (Europe/Rome timezone)

Response headers:

- `X-Feedback-Total`: total number of feedback entries currently stored
- `X-Feedback-Exported`: how many entries are currently marked as exported

## Export modes

### Incremental export (default)

Downloads only the feedback entries that have not been exported yet (up to `limit`) and then marks them as exported.

Query parameters:

- `download=1` (required to download)
- `key` (required if `FEEDBACK_EXPORT_KEY` is set)
- `limit` (optional, default `1000`, max `5000`)
- `mark=0` (optional): do not mark entries as exported (preview mode)

Examples:

- Download next batch (default limit):
  - `/api/feedback?download=1&key=YOUR_SECRET_KEY`
- Download next 200 and mark them as exported:
  - `/api/feedback?download=1&key=YOUR_SECRET_KEY&limit=200`
- Preview next batch without marking:
  - `/api/feedback?download=1&key=YOUR_SECRET_KEY&limit=200&mark=0`

### Full export (`all=1`)

Downloads all feedback entries from the beginning, ignoring the exported counter. This does not update the exported counter.

Query parameters:

- `download=1` (required to download)
- `key` (required if `FEEDBACK_EXPORT_KEY` is set)
- `all=1`

Example:

- `/api/feedback?key=YOUR_SECRET_KEY&all=1`
  - `/api/feedback?download=1&key=YOUR_SECRET_KEY&all=1`

export type SaveSentenceBlockPayload = {
  fileName: string;
  blockIndex: number;
  english: string;
  italian: string;
  answer: string;
};

export async function saveSentenceBlock(payload: SaveSentenceBlockPayload): Promise<void> {
  const res = await fetch('/api/dev/sentence-block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Save failed (${res.status})`);
  }
}

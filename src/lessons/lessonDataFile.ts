const GENKI_FILE_RE = /^genki-\d{2}-\d\.txt$/;
const SENTENCE_FILE_RE = /^sentence-[a-z0-9-]+\.txt$/;

/** Maps session id (e.g. genki16-4, sentence-obligation) to a data file name. */
export function lessonIdToDataFile(lessonId: string): string | null {
  const genki = /^genki(\d+)-(\d+)$/.exec(lessonId);
  if (genki) {
    const lesson = genki[1]!.padStart(2, '0');
    const exercise = genki[2]!;
    return `genki-${lesson}-${exercise}.txt`;
  }
  if (/^sentence-[a-z0-9-]+$/.test(lessonId)) {
    return `${lessonId}.txt`;
  }
  return null;
}

export function isEditableSentenceDataFile(fileName: string): boolean {
  return GENKI_FILE_RE.test(fileName) || SENTENCE_FILE_RE.test(fileName);
}

export function isEditableSentenceLesson(lessonId: string | undefined): boolean {
  if (!lessonId) return false;
  const file = lessonIdToDataFile(lessonId);
  return file !== null && isEditableSentenceDataFile(file);
}

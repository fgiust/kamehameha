export interface ReadingItem {
  question: string; // e.g. kanji
  answer: string;   // e.g. kana reading
  meaning?: string; // optional meaning / context
}

export class KanaReadingEngine {
  private items: ReadingItem[];

  constructor(items: ReadingItem[]) {
    this.items = items;
  }

  /**
   * Generates a random item from the pool, optionally excluding a specific key.
   */
  public getRandomItem(excludeQuestion?: string): ReadingItem {
    const pool = excludeQuestion
      ? this.items.filter(item => item.question !== excludeQuestion)
      : this.items;
    const activePool = pool.length > 0 ? pool : this.items;
    return activePool[Math.floor(Math.random() * activePool.length)];
  }

  /**
   * Checks if user's input matches either the kana reading or the original kanji.
   */
  public checkAnswer(item: ReadingItem, input: string): boolean {
    const normalized = input.trim();
    return normalized === item.answer || normalized === item.question;
  }
}

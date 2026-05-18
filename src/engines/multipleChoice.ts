/**
 * Reusable Multiple Choice Quiz Engine
 */

export interface MultipleChoiceConfig {
  choices: string[];
  questions: Record<string, string[]>;
}

export interface MultipleChoiceQuestion {
  text: string;
  correctAnswer: string;
}

export class MultipleChoiceEngine {
  private config: MultipleChoiceConfig;

  constructor(config: MultipleChoiceConfig) {
    this.config = config;
  }

  /**
   * Generates a new random question from the configured list
   */
  generateQuestion(): MultipleChoiceQuestion {
    const { choices, questions } = this.config;
    
    // Choose a random category/answer
    const validChoices = choices.filter(c => questions[c] && questions[c].length > 0);
    if (validChoices.length === 0) {
      throw new Error("MultipleChoiceEngine: config contains no valid questions");
    }

    const correctAnswer = validChoices[Math.floor(Math.random() * validChoices.length)];
    const targetQuestions = questions[correctAnswer]!;
    const text = targetQuestions[Math.floor(Math.random() * targetQuestions.length)];

    return {
      text,
      correctAnswer
    };
  }

  /**
   * Verifies if the user's choice is correct
   */
  checkAnswer(choice: string, correctAnswer: string): boolean {
    return choice === correctAnswer;
  }
}

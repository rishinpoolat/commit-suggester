import axios from 'axios';
import { FileChange } from '../types';

export class AIService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSuggestions(changes: FileChange[]): Promise<string[]> {
    try {
      const prompt = this.constructPrompt(changes);
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        }
      );

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  private constructPrompt(changes: FileChange[]): string {
    return `Generate 3 commit messages in conventional commit format for these changes:

${changes.map(change => `
File: ${change.filename}
Changes: +${change.additions} -${change.deletions}
Diff:
${change.diff}
`).join('\n')}

Format: type(scope): description
Example: feat(auth): add login functionality

Respond with ONLY 3 commit messages, one per line.`;
  }

  private parseResponse(response: any): string[] {
    try {
      const text = response.candidates[0].content.parts[0].text;
      return text.split('\n').filter(Boolean).slice(0, 3);
    } catch (error) {
      return [];
    }
  }
}
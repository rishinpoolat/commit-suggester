import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FileChange } from '../types';

const execAsync = promisify(exec);

export class AIService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSuggestions(changes: FileChange[]): Promise<string[]> {
    try {
      const prompt = await this.constructPrompt(changes);
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          }
        }
      );

      return this.parseResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
        throw new Error(`Failed to generate commit suggestions: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  private getFileScope(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'css':
      case 'scss':
        return 'styles';
      case 'test.ts':
      case 'spec.ts':
        return 'tests';
      case 'md':
        return 'docs';
      default:
        return filename.split('/')[0] || 'core';
    }
  }

  private async getRepoContext(): Promise<string> {
    try {
      const { stdout: branch } = await execAsync('git branch --show-current');
      const { stdout: recentCommits } = await execAsync('git log -3 --oneline');
      return `Branch: ${branch.trim()}\n\nRecent commits:\n${recentCommits}`;
    } catch {
      return '';
    }
  }

  private async constructPrompt(changes: FileChange[]): Promise<string> {
    const scopes = [...new Set(changes.map(c => this.getFileScope(c.filename)))];
    const stats = changes.reduce((acc, curr) => ({
      additions: acc.additions + curr.additions,
      deletions: acc.deletions + curr.deletions
    }), { additions: 0, deletions: 0 });

    const repoContext = await this.getRepoContext();

    return `As an expert developer, analyze these git changes and suggest commit messages.

Repository Context:
${repoContext}

Changes Summary:
- Files changed: ${changes.length}
- Total: +${stats.additions} -${stats.deletions}
- Modified components: ${scopes.join(', ')}

Changes:
${changes.map(change => `
File: ${change.filename}
Type: ${this.getFileScope(change.filename)}
Changes: +${change.additions} -${change.deletions}
Status: ${change.status}
Diff:
${change.diff}
`).join('\n')}

Generate THREE different commit messages following these rules:
- Use conventional commits format: type(scope): description
- Types: feat|fix|refactor|style|docs|test|chore|perf
- Keep description under 50 characters
- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at end

Return exactly three commit messages in this JSON format:
{
  "suggestions": [
    {
      "message": "type(scope): description",
      "explanation": "Why this message fits the changes"
    },
    {...},
    {...}
  ]
}`;
  }

  private parseResponse(response: any): string[] {
    try {
      const text = response.candidates[0].content.parts[0].text;
      
      // Clean up response and parse JSON
      const cleanedResponse = text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }

      return parsed.suggestions.map((s: { message: string }) => s.message);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse commit suggestions');
    }
  }
}
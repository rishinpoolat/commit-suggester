import { FileChange, GeminiResponse } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

export class AIService {
  private readonly apiUrl: string;

  constructor(private readonly apiKey: string) {
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
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

  private async getRepoContext(): Promise<{ branch: string; commits: string }> {
    try {
      const [branch, commits] = await Promise.all([
        execAsync('git branch --show-current').then(res => res.stdout.trim()),
        execAsync('git log -3 --oneline').then(res => res.stdout.trim())
      ]);

      return { branch, commits };
    } catch {
      return { branch: '', commits: '' };
    }
  }

  private async constructPrompt(changes: FileChange[]): Promise<string> {
    const scopes = [...new Set(changes.map(c => this.getFileScope(c.filename)))];
    const stats = changes.reduce((acc, curr) => ({
      additions: acc.additions + curr.additions,
      deletions: acc.deletions + curr.deletions
    }), { additions: 0, deletions: 0 });

    const context = await this.getRepoContext();

    return `You are a git commit message expert. Analyze these changes and generate appropriate conventional commit messages.

Changes Summary:
Files: ${changes.length} changed
Stats: +${stats.additions} -${stats.deletions}
Scopes: ${scopes.join(', ')}

Branch: ${context.branch}
Recent Commits:
${context.commits}

Modified Files:
${changes.map(change => `
${change.filename} (${change.status}):
+${change.additions} -${change.deletions}
${change.diff.slice(0, 500)}${change.diff.length > 500 ? '...' : ''}`).join('\n')}

Generate exactly three commit messages that:
1. Follow format: type(scope): description
2. Use types: feat|fix|refactor|style|docs|test|chore|perf
3. Keep descriptions concise (under 50 chars)
4. Use imperative mood
5. Start lowercase
6. No period at end

Your response must be valid JSON in this exact format:
{
  "suggestions": [
    {
      "message": "type(scope): description",
      "explanation": "Brief explanation"
    }
  ]
}`;
  }

  private parseResponse(response: any): string[] {
    try {
      const text = response.candidates[0].content.parts[0].text;
      
      // Remove any markdown formatting or extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const cleanedJson = jsonMatch[0].replace(/\\n/g, ' ').trim();
      const parsed = JSON.parse(cleanedJson) as GeminiResponse;

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }

      return parsed.suggestions.map(s => s.message);
    } catch (error) {
      console.error('Raw response:', response?.candidates?.[0]?.content?.parts?.[0]?.text);
      throw error;
    }
  }
}
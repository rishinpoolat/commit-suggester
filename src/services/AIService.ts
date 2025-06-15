import axios from 'axios';
import type { FileChange } from '../types';

interface AIConfig {
  provider?: string;
  model?: string;
  apiKey?: string;
}

export class AIService {
  constructor(_config: AIConfig = {}) {
    // Config not used currently, all settings come from env vars
  }

  private getEnvApiKey(): { provider: string; apiKey: string; model: string } {
    // Priority order: Groq > OpenAI > Anthropic > Google
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile'
      };
    }
    
    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
      };
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      return {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-haiku-20241022'
      };
    }
    
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) {
      return {
        provider: 'google',
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY!,
        model: 'gemini-1.5-flash'
      };
    }

    throw new Error(`No AI API key found. Please set one of:
- export GROQ_API_KEY="your_key"                    # For Groq (Recommended - Fast & Free)
- export OPENAI_API_KEY="your_key"                  # For OpenAI  
- export ANTHROPIC_API_KEY="your_key"               # For Anthropic
- export GOOGLE_GENERATIVE_AI_API_KEY="your_key"    # For Google Gemini

Add to your ~/.zshrc or ~/.bashrc and run: source ~/.zshrc`);
  }

  async getSuggestions(changes: FileChange[]): Promise<string[]> {
    const { provider, apiKey, model } = this.getEnvApiKey();
    console.log(`🤖 Using ${provider.toUpperCase()} AI (${model})`);

    const prompt = this.buildPrompt(changes);

    try {
      switch (provider) {
        case 'groq':
          return await this.callGroq(apiKey, model, prompt);
        case 'openai':
          return await this.callOpenAI(apiKey, model, prompt);
        case 'anthropic':
          return await this.callAnthropic(apiKey, model, prompt);
        case 'google':
          return await this.callGoogle(apiKey, model, prompt);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider.toUpperCase()} API Error:`, error instanceof Error ? error.message : error);
      throw new Error(`Failed to generate commit suggestions with ${provider.toUpperCase()}`);
    }
  }

  private async callGroq(apiKey: string, model: string, prompt: string): Promise<string[]> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseResponse(response.data.choices[0].message.content);
  }

  private async callOpenAI(apiKey: string, model: string, prompt: string): Promise<string[]> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseResponse(response.data.choices[0].message.content);
  }

  private async callAnthropic(apiKey: string, model: string, prompt: string): Promise<string[]> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return this.parseResponse(response.data.content[0].text);
  }

  private async callGoogle(apiKey: string, model: string, prompt: string): Promise<string[]> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return this.parseResponse(response.data.candidates[0].content.parts[0].text);
  }

  private buildPrompt(changes: FileChange[]): string {
    const stats = changes.reduce((acc, change) => ({
      additions: acc.additions + change.additions,
      deletions: acc.deletions + change.deletions
    }), { additions: 0, deletions: 0 });

    const filesSummary = changes.map(change => 
      `${change.filename} (+${change.additions}/-${change.deletions})`
    ).join(', ');

    return `Analyze these git changes and generate 3 conventional commit messages.

Files changed (${changes.length}): ${filesSummary}
Total changes: +${stats.additions}/-${stats.deletions}

Changes:
${changes.map(change => `
File: ${change.filename}
Status: ${change.status}
Diff:
${change.diff.slice(0, 2000)}${change.diff.length > 2000 ? '...' : ''}
`).join('\n')}

Return ONLY valid JSON in this format:
{
  "suggestions": [
    "feat(scope): description",
    "fix(scope): description", 
    "refactor(scope): description"
  ]
}

IMPORTANT: Order suggestions by quality - put the BEST, most accurate commit message first!

Rules:
- Use conventional commits: feat|fix|docs|style|refactor|test|chore|perf
- Keep under 70 characters
- Use imperative mood ("add" not "added")
- Be specific about what changed
- No period at end
- First suggestion should be the most accurate and descriptive`;
  }

  private parseResponse(text: string): string[] {
    try {
      // Clean up response
      let cleanText = text.trim();
      if (cleanText.includes('```')) {
        const match = cleanText.match(/```(?:json)?\n?(.*?)\n?```/s);
        if (match) cleanText = match[1];
      }

      const parsed = JSON.parse(cleanText);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions.slice(0, 3); // Max 3 suggestions
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Parse error:', error);
      // Fallback: extract any text that looks like commit messages
      const lines = text.split('\n').filter(line => 
        line.includes(':') && 
        /^(feat|fix|docs|style|refactor|test|chore|perf)/.test(line.trim())
      );
      
      if (lines.length > 0) {
        return lines.slice(0, 3);
      }
      
      // Ultimate fallback
      return [
        'feat: update codebase',
        'fix: resolve issues', 
        'refactor: improve code'
      ];
    }
  }
}
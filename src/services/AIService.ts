import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import { FileChange } from "../types";
import { updateSpinnerText, setCurrentModel } from "../cli-utils";

const execAsync = promisify(exec);

export class AIService {
  private readonly apiKey: string;
  private readonly baseApiUrl = "https://generativelanguage.googleapis.com/v1/models";
  // Try models in this order until one works
  private readonly modelOptions = [
    "gemini-1.5-flash",  // Faster model (prioritized for speed)
    "gemini-1.5-pro",    // Newer model (Feb 2025)
    "gemini-pro",        // Original model
    "gemini-1.0-pro"     // Alternative naming
  ];
  private readonly defaultModel = "gemini-1.5-pro";
  private currentModel: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Start with the first model in our list
    this.currentModel = this.modelOptions[0];
    setCurrentModel(this.currentModel);
  }

  private getApiUrl(): string {
    return `${this.baseApiUrl}/${this.currentModel}:generateContent`;
  }

  async getSuggestions(changes: FileChange[]): Promise<string[]> {
    try {
      updateSpinnerText('start');
      const prompt = await this.constructPrompt(changes);
      
      // Let's add a note to not wrap in code blocks to avoid parsing issues
      const enhancedPrompt = prompt + "\n\nIMPORTANT: Do not wrap your JSON response in code blocks or markdown formatting. Return only the raw, valid JSON.";
      
      updateSpinnerText('model');
      updateSpinnerText('processing');
      const response = await axios.post(`${this.getApiUrl()}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024, // Reduced from 1024 for faster response
        },
      
      });

      updateSpinnerText('parsing');
      return this.parseResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("API Response:", error.response?.data);
        let errorMessage = error.response?.data?.error?.message || error.message;
        
        // Check if the error is about model availability
        if (errorMessage.includes(`models/${this.currentModel} is not found`) || 
            errorMessage.includes('is not supported for generateContent')) {
          // Find the current model index
          const currentIndex = this.modelOptions.indexOf(this.currentModel);
          
          // Try the next model in our list
          if (currentIndex < this.modelOptions.length - 1) {
            const nextModel = this.modelOptions[currentIndex + 1];
            console.log(`Model ${this.currentModel} not found, trying with ${nextModel}...`);
            this.currentModel = nextModel;
            setCurrentModel(this.currentModel);
            updateSpinnerText('model');
            return this.getSuggestions(changes);
          } else if (currentIndex === -1 && this.currentModel !== this.defaultModel) {
            // If current model isn't in our list, try the default
            console.log(`Model ${this.currentModel} not found, trying with ${this.defaultModel}...`);
            this.currentModel = this.defaultModel;
            setCurrentModel(this.currentModel);
            updateSpinnerText('model');
            return this.getSuggestions(changes);
          }
        }
        
        if (errorMessage.includes("is not found")) {
          errorMessage += "\n\nTry checking the available models by visiting: https://ai.google.dev/models/gemini";
        }
        
        throw new Error(`Failed to generate commit suggestions: ${errorMessage}`);
      }
      throw error;
    }
  }

  private getFileScope(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const dir = filename.split("/")[0].toLowerCase();

    // Directory-based scopes
    if (["src", "lib", "packages"].includes(dir)) {
      return filename.split("/")[1] || dir;
    }

    // Extension-based scopes
    switch (ext) {
      case "ts":
      case "tsx":
        return filename.includes("test") ? "tests" : "core";
      case "js":
      case "jsx":
        return filename.includes("test") ? "tests" : "core";
      case "css":
      case "scss":
      case "less":
        return "styles";
      case "test.ts":
      case "spec.ts":
        return "tests";
      case "md":
        return "docs";
      case "json":
        return "config";
      default:
        return "core";
    }
  }

  private async getRepoContext(): Promise<string> {
    try {
      const { stdout: branch } = await execAsync("git branch --show-current");
      const { stdout: recentCommits } = await execAsync("git log -3 --oneline");
      const { stdout: remoteUrl } = await execAsync(
        "git remote get-url origin"
      ).catch(() => ({ stdout: "" }));

      return `Branch: ${branch.trim()}
Remote: ${remoteUrl.trim()}
Recent commits:
${recentCommits}`;
    } catch {
      return "";
    }
  }

  private async constructPrompt(changes: FileChange[]): Promise<string> {
    const scopes = [
      ...new Set(changes.map((c) => this.getFileScope(c.filename))),
    ];
    const stats = changes.reduce(
      (acc, curr) => ({
        additions: acc.additions + curr.additions,
        deletions: acc.deletions + curr.deletions,
      }),
      { additions: 0, deletions: 0 }
    );

    const repoContext = await this.getRepoContext();
    
    // Limit diff size to avoid slow API responses
    const processedChanges = changes.map(change => {
      // Limit diff to 50 lines maximum per file to speed up processing
      let truncatedDiff = change.diff;
      const diffLines = truncatedDiff.split('\n');
      if (diffLines.length > 50) {
        truncatedDiff = diffLines.slice(0, 50).join('\n') + '\n[... additional changes truncated for brevity ...]';
      }
      return {
        ...change,
        diff: truncatedDiff
      };
    });

    return `You are an expert developer analyzing git diffs to generate commit messages. Your response must be in valid JSON format only.

Repository Context:
${repoContext}

Changes Summary:
- Files changed: ${changes.length}
- Total: +${stats.additions} -${stats.deletions}
- Modified components: ${scopes.join(", ")}

Changes:
${processedChanges
  .map(
    (change) => `
File: ${change.filename}
Type: ${this.getFileScope(change.filename)}
Changes: +${change.additions} -${change.deletions}
Status: ${change.status}
Diff:
${change.diff}
`
  )
  .join("\n")}

Generate THREE commit messages that follow these rules:
1. Format: type(scope): description
2. Types: feat|fix|refactor|style|docs|test|chore|perf
3. First line under 70 characters
4. Use imperative mood ("add" not "added")
5. No period at end
6. Be specific but concise

Return ONLY a valid JSON object with your suggestions in this format:
{
  "suggestions": [
    {
      "message": "type(scope): description",
      "explanation": "Brief explanation of why this message fits"
    },
    {...},
    {...}
  ]
}`;
  }

  private parseResponse(response: any): string[] {
    try {
      // Different Gemini API versions might have slightly different response formats
      let text = '';
      
      // First try the standard format
      if (response.candidates && 
          response.candidates[0]?.content?.parts && 
          response.candidates[0].content.parts[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      } 
      // Try alternative formats if needed
      else if (response.candidates && response.candidates[0]?.text) {
        text = response.candidates[0].text;
      }
      else if (response.text) {
        text = response.text;
      }
      else {
        console.error('Unexpected API response format:', JSON.stringify(response, null, 2));
        throw new Error('Unexpected response format from Gemini API');
      }

      // More robust JSON extraction and parsing
      let cleanedResponse = text.trim();
      
      // Remove code blocks more aggressively
      if (cleanedResponse.includes('```')) {
        // Extract content between code block markers if they exist
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          cleanedResponse = codeBlockMatch[1].trim();
        } else {
          // If we can't extract, just remove all backticks
          cleanedResponse = cleanedResponse.replace(/```json?|```/g, '').trim();
        }
      }

      // Try to parse the JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (e) {
        // If JSON parsing fails, try to extract just the suggestions part
        console.log('Initial parsing failed, trying to fix JSON format...');
        
        // Look for a suggestions array pattern and extract it
        const suggestionsMatch = cleanedResponse.match(/"suggestions"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
        if (suggestionsMatch && suggestionsMatch[1]) {
          try {
            const suggestionsArray = JSON.parse(suggestionsMatch[1]);
            parsed = { suggestions: suggestionsArray };
          } catch (e2) {
            console.error('Failed to parse suggestions array:', e2);
          }
        }
        
        // If we still don't have valid JSON, create a basic structure
        if (!parsed) {
          console.log('Creating fallback suggestions from raw text...');
          // Try to extract something that looks like a commit message
          const lines = cleanedResponse.split('\n');
          const messageLines = lines.filter(line => 
            line.trim() && 
            line.includes(':') && 
            !line.includes('{') && 
            !line.includes('}'));
          
          if (messageLines.length > 0) {
            parsed = {
              suggestions: messageLines.map(line => ({
                message: line.trim().replace(/"message"\s*:\s*"(.+?)".*/, '$1'),
              }))
            };
          } else {
            throw new Error('Could not extract valid commit messages from response');
          }
        }
      }

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error("Invalid response format: missing suggestions array");
      }

      return parsed.suggestions.map((s: { message: string }) => s.message);
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      console.error("Response received:", JSON.stringify(response, null, 2));
      throw new Error("Failed to parse commit suggestions. Check console for details.");
    }
  }
}

import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import { FileChange } from "../types";

const execAsync = promisify(exec);

export class AIService {
  private readonly apiKey: string;
  private readonly apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSuggestions(changes: FileChange[]): Promise<string[]> {
    try {
      const prompt = await this.constructPrompt(changes);
      const response = await axios.post(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      });

      return this.parseResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("API Response:", error.response?.data);
        throw new Error(
          `Failed to generate commit suggestions: ${
            error.response?.data?.error?.message || error.message
          }`
        );
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

    return `You are an expert developer analyzing git diffs to generate commit messages. Your response must be in valid JSON format only.

Repository Context:
${repoContext}

Changes Summary:
- Files changed: ${changes.length}
- Total: +${stats.additions} -${stats.deletions}
- Modified components: ${scopes.join(", ")}

Changes:
${changes
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
3. First line under 50 characters
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
      const text = response.candidates[0].content.parts[0].text;

      // Clean up response and parse JSON
      const cleanedResponse = text
        .replace(/^```(?:json)?\n?|\n?```$/g, "")
        .trim();
      const parsed = JSON.parse(cleanedResponse);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error("Invalid response format: missing suggestions array");
      }

      return parsed.suggestions.map((s: { message: string }) => s.message);
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse commit suggestions");
    }
  }
}

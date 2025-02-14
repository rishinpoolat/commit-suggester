export interface FileChange {
  filename: string;
  diff: string;
  additions: number;
  deletions: number;
  status: GitFileStatus;
}

export interface CommitConfig {
  apiKey: string;
}

export interface CommitSuggestion {
  message: string;
  explanation: string;
  type?: string;
  scope?: string;
}

export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'updated';

export interface GeminiResponse {
  suggestions: Array<{
    message: string;
    explanation: string;
  }>;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
}
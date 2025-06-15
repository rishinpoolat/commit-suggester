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
  source: 'ai' | 'rule';
}

export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'updated';

export const GitFileStatusEnum = {
  ADDED: 'added' as const,
  MODIFIED: 'modified' as const,
  DELETED: 'deleted' as const,
  RENAMED: 'renamed' as const,
  COPIED: 'copied' as const,
  UPDATED: 'updated' as const
} as const;

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  suggestions?: Array<{
    message: string;
    explanation: string;
  }>;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface GitServiceConfig {
  maxBuffer?: number;
}

export interface HistoricalCommit {
  hash: string;
  message: string;
}
export interface SuggesterConfig {
  apiKey: string;
  customTemplates?: Record<string, string>;
}

export interface FileChange {
  filename: string;
  diff: string;
  additions: number;
  deletions: number;
}

export interface CommitSuggestion {
  message: string;
  type: string;
  scope?: string;
  source?: 'rule' | 'ai' | 'error';
  confidence?: number;
}
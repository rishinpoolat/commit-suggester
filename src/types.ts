export interface FileChange {
  filename: string;
  diff: string;
  additions: number;
  deletions: number;
  status: string;
}

export interface CommitSuggestion {
  message: string;
  explanation: string;
  type?: string;
  scope?: string;
  source?: string;
  confidence?: number;
}

export interface SuggesterConfig {
  apiKey: string;
}

export interface AnalysisResult {
  type: string;
  scope: string;
  component: string;
}
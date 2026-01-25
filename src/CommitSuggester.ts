import { GitService } from './services/GitService';
import { AIService } from './services/AIService';

export interface CommitSuggesterOptions {
  stagedOnly?: boolean;
}

export class CommitSuggester {
  private gitService: GitService;
  private aiService: AIService;
  private options: CommitSuggesterOptions;

  constructor(options: CommitSuggesterOptions = {}) {
    this.gitService = new GitService();
    this.aiService = new AIService();
    this.options = options;
  }

  async getSuggestions(): Promise<string[]> {
    const changes = await this.gitService.getAllChanges(this.options.stagedOnly);
    return await this.aiService.getSuggestions(changes);
  }

  async commit(message: string): Promise<void> {
    await this.gitService.commit(message);
  }

  async getChangeSummary(): Promise<{ files: number; additions: number; deletions: number }> {
    const changes = await this.gitService.getAllChanges(this.options.stagedOnly);
    const stats = changes.reduce((acc, change) => ({
      files: acc.files + 1,
      additions: acc.additions + change.additions,
      deletions: acc.deletions + change.deletions
    }), { files: 0, additions: 0, deletions: 0 });
    
    return stats;
  }
}
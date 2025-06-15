import { GitService } from './services/GitService';
import { AIService } from './services/AIService';

export class CommitSuggester {
  private gitService: GitService;
  private aiService: AIService;

  constructor() {
    this.gitService = new GitService();
    this.aiService = new AIService();
  }

  async getSuggestions(): Promise<string[]> {
    const changes = await this.gitService.getAllChanges();
    return await this.aiService.getSuggestions(changes);
  }

  async commit(message: string): Promise<void> {
    await this.gitService.commit(message);
  }

  async getChangeSummary(): Promise<{ files: number; additions: number; deletions: number }> {
    const changes = await this.gitService.getAllChanges();
    const stats = changes.reduce((acc, change) => ({
      files: acc.files + 1,
      additions: acc.additions + change.additions,
      deletions: acc.deletions + change.deletions
    }), { files: 0, additions: 0, deletions: 0 });
    
    return stats;
  }
}
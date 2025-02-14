import { GitService } from './services/git.service';
import { AIService } from './services/ai.service';
import { CommitConfig } from './types';

export class CommitSuggester {
  private readonly gitService: GitService;
  private readonly aiService: AIService;

  constructor(config: CommitConfig) {
    this.gitService = new GitService();
    this.aiService = new AIService(config.apiKey);
  }

  async getSuggestions(): Promise<string[]> {
    try {
      if (!await this.gitService.hasGitConfig()) {
        throw new Error(
          'Git user not configured. Run:\n' +
          'git config --global user.email "you@example.com"\n' +
          'git config --global user.name "Your Name"'
        );
      }

      const files = await this.gitService.getStagedFiles();
      return await this.aiService.getSuggestions(files);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No staged changes')) {
        throw new Error('No changes staged for commit. Use git add to stage your changes.');
      }
      throw error;
    }
  }

  async commitChanges(message: string): Promise<void> {
    return this.gitService.commitChanges(message);
  }

  async getCurrentBranch(): Promise<string> {
    return this.gitService.getCurrentBranch();
  }

  async getRecentCommits(): Promise<string[]> {
    return this.gitService.getRecentCommits();
  }
}
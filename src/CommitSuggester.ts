import { GitService } from './services/GitService';
import { AIService } from './services/AIService';

export interface CommitConfig {
  apiKey: string;
}

export class CommitSuggester {
  private gitService: GitService;
  private aiService: AIService;

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
    try {
      const stagedChanges = await this.gitService.getStagedFiles();
      if (stagedChanges.length === 0) {
        throw new Error('No changes staged for commit. Use git add to stage your changes.');
      }

      // Escape quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      await this.gitService.commitChanges(escapedMessage);
    } catch (error) {
      throw error;
    }
  }
}
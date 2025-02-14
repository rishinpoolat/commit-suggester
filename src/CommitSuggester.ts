import { GitService } from './services/GitService';
import { AIService } from './services/AIService';
import { SuggesterConfig } from './types';

export class CommitSuggester {
  private gitService: GitService;
  private aiService: AIService;

  constructor(config: SuggesterConfig) {
    this.gitService = new GitService();
    this.aiService = new AIService(config.apiKey);
  }

  async getSuggestions(): Promise<string[]> {
    try {
      // Verify git setup
      if (!await this.gitService.hasGitConfig()) {
        throw new Error('Git user not configured. Run:\ngit config --global user.email "you@example.com"\ngit config --global user.name "Your Name"');
      }

      // Get staged files with their diffs
      const files = await this.gitService.getStagedFiles();

      // Get commit suggestions from AI
      const suggestions = await this.aiService.getSuggestions(files);
      
      return suggestions;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('No staged changes')) {
        throw new Error('No changes staged for commit. Use git add to stage your changes.');
      }
      throw error;
    }
  }

  async getCurrentBranch(): Promise<string> {
    return this.gitService.getCurrentBranch();
  }

  async getRecentCommits(): Promise<string[]> {
    return this.gitService.getRecentCommits();
  }
}
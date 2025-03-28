import { GitService } from './services/GitService';
import { AIService } from './services/AIService';

export interface CommitConfig {
  apiKey: string;
}

export interface CommitStats {
  files: number;
  additions: number;
  deletions: number;
}

export interface SuggestionsResult {
  suggestions: string[];
  stats: CommitStats;
}

export class CommitSuggester {
  private gitService: GitService;
  private aiService: AIService;

  constructor(config: CommitConfig) {
    this.gitService = new GitService();
    this.aiService = new AIService(config.apiKey);
  }

  async getSuggestions(): Promise<string[]> {
    const { suggestions } = await this.getSuggestionsWithStats();
    return suggestions;
  }

  async getSuggestionsWithStats(): Promise<SuggestionsResult> {
    try {
      if (!await this.gitService.hasGitConfig()) {
        throw new Error(
          'Git user not configured. Run:\n' +
          'git config --global user.email "you@example.com"\n' +
          'git config --global user.name "Your Name"'
        );
      }

      // Automatically stage all changes
      await this.gitService.stageAllChanges();
      
      const files = await this.gitService.getStagedFiles();
      
      // Calculate stats
      const stats: CommitStats = {
        files: files.length,
        additions: files.reduce((sum, file) => sum + file.additions, 0),
        deletions: files.reduce((sum, file) => sum + file.deletions, 0)
      };
      
      const suggestions = await this.aiService.getSuggestions(files);
      
      return {
        suggestions,
        stats
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No changes found')) {
        throw new Error('No changes found to commit. Make some changes to your files first.');
      }
      throw error;
    }
  }

  async commitChanges(message: string): Promise<void> {
    try {
      const stagedChanges = await this.gitService.getStagedFiles();
      if (stagedChanges.length === 0) {
        throw new Error('No changes found to commit. Make some changes to your files first.');
      }

      // Escape quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      await this.gitService.commitChanges(escapedMessage);
    } catch (error) {
      throw error;
    }
  }
}
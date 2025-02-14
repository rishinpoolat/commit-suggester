import { GitService } from './services/GitService';
import { AIService } from './services/AIService';
import { SuggesterConfig } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  async commitChanges(message: string): Promise<void> {
    try {
      const stagedChanges = await execAsync('git diff --staged --quiet || echo "has changes"');
      
      if (!stagedChanges) {
        throw new Error('No changes staged for commit. Use git add to stage your changes.');
      }

      // Escape quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      
      await execAsync(`git commit -m "${escapedMessage}"`);
      console.log('Changes committed successfully!');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not a git repository')) {
          throw new Error('Not a git repository. Initialize git first with: git init');
        } else if (error.message.includes('please tell me who you are')) {
          throw new Error('Git user not configured. Run:\ngit config --global user.email "you@example.com"\ngit config --global user.name "Your Name"');
        }
        throw error;
      }
      throw new Error('Failed to commit changes');
    }
  }

  async getCurrentBranch(): Promise<string> {
    return this.gitService.getCurrentBranch();
  }

  async getRecentCommits(): Promise<string[]> {
    return this.gitService.getRecentCommits();
  }
}
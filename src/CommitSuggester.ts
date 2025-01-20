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
    const files = await this.gitService.getStagedFiles();

    if (files.length === 0) {
      return ['No staged changes found'];
    }

    try {
      const aiSuggestions = await this.aiService.getSuggestions(files);
      return aiSuggestions.slice(0, 3);
    } catch (error) {
      return [
        'feat: add new functionality',
        'fix: resolve issue',
        'chore: update configuration'
      ];
    }
  }
}
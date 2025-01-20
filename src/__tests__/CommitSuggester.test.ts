import { CommitSuggester } from '../CommitSuggester';
import { GitService } from '../services/GitService';
import { AIService } from '../services/AIService';

// Mock the services
jest.mock('../services/GitService');
jest.mock('../services/AIService');

describe('CommitSuggester', () => {
  let suggester: CommitSuggester;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    suggester = new CommitSuggester({
      apiKey: 'test-key',
      aiEnabled: true
    });
  });

  test('returns error when no staged changes', async () => {
    // Mock GitService to return empty files
    (GitService.prototype.getStagedFiles as jest.Mock).mockResolvedValue([]);

    const suggestions = await suggester.getSuggestions();
    
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toEqual({
      message: 'No staged changes found',
      type: 'error',
      source: 'error'
    });
  });

  test('returns both rule-based and AI suggestions when files are staged', async () => {
    // Mock staged files
    const mockFiles = [{
      filename: 'src/test.ts',
      diff: 'test diff',
      additions: 10,
      deletions: 5
    }];

    // Mock historical commits
    const mockHistory = [{
      message: 'feat(test): add new feature',
      type: 'feat',
      scope: 'test',
      description: 'add new feature'
    }];

    (GitService.prototype.getStagedFiles as jest.Mock).mockResolvedValue(mockFiles);
    (GitService.prototype.getHistoricalCommits as jest.Mock).mockResolvedValue(mockHistory);
    
    (AIService.prototype.getSuggestions as jest.Mock).mockResolvedValue([
      {
        message: 'feat(test): implement new functionality',
        type: 'feat',
        scope: 'test',
        source: 'ai'
      }
    ]);

    const suggestions = await suggester.getSuggestions();
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.source === 'rule')).toBe(true);
    expect(suggestions.some(s => s.source === 'ai')).toBe(true);
  });

  test('falls back to rule-based suggestions when AI fails', async () => {
    // Mock staged files
    const mockFiles = [{
      filename: 'src/test.ts',
      diff: 'test diff',
      additions: 10,
      deletions: 5
    }];

    (GitService.prototype.getStagedFiles as jest.Mock).mockResolvedValue(mockFiles);
    (AIService.prototype.getSuggestions as jest.Mock).mockRejectedValue(new Error('AI API failed'));

    const suggestions = await suggester.getSuggestions();
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every(s => s.source === 'rule')).toBe(true);
  });
});
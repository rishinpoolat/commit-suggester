import { CommitSuggester } from '../CommitSuggester';
import { GitService } from '../services/GitService';
import { AIService } from '../services/AIService';
import type { FileChange } from '../types';

jest.mock('../services/GitService');
jest.mock('../services/AIService');

describe('CommitSuggester', () => {
  let commitSuggester: CommitSuggester;
  const mockConfig = { apiKey: 'test-key' };

  beforeEach(() => {
    commitSuggester = new CommitSuggester(mockConfig);
    jest.clearAllMocks();
  });

  test('returns error when no staged changes', async () => {
    const GitServiceMock = GitService as jest.MockedClass<typeof GitService>;
    GitServiceMock.prototype.getStagedFiles.mockResolvedValue([]);

    await expect(commitSuggester.getSuggestions()).rejects.toThrow(
      'No changes staged for commit'
    );
  });

  test('returns suggestions when files are staged', async () => {
    const mockFiles: FileChange[] = [
      {
        filename: 'test.ts',
        diff: 'test changes',
        additions: 1,
        deletions: 0,
        status: 'modified'
      }
    ];

    const mockSuggestions: string[] = [
      'feat(test): add new functionality'
    ];

    const GitServiceMock = GitService as jest.MockedClass<typeof GitService>;
    const AIServiceMock = AIService as jest.MockedClass<typeof AIService>;

    GitServiceMock.prototype.getStagedFiles.mockResolvedValue(mockFiles);
    AIServiceMock.prototype.getSuggestions.mockResolvedValue(mockSuggestions);

    const suggestions = await commitSuggester.getSuggestions();
    expect(suggestions).toHaveLength(mockSuggestions.length);
    expect(suggestions[0]).toBe(mockSuggestions[0]);
  });
});
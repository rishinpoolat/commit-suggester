import { exec } from 'child_process';
import { promisify } from 'util';
import { FileChange } from '../types';

const execAsync = promisify(exec);

// Increased maxBuffer size to handle larger diffs
const MAX_BUFFER = 1024 * 1024 * 10; // 10MB buffer

export class GitService {
  async getStagedFiles(): Promise<FileChange[]> {
    try {
      // First check if we're in a git repository
      await execAsync('git rev-parse --is-inside-work-tree', { maxBuffer: MAX_BUFFER });

      // Get list of staged files
      const { stdout: stagedFiles } = await execAsync('git diff --cached --name-only', { maxBuffer: MAX_BUFFER });
      const files = stagedFiles.split('\n').filter(Boolean);

      if (files.length === 0) {
        throw new Error('No staged changes found. Use git add to stage your changes.');
      }

      const changes = await Promise.all(
        files.map(async (filename) => {
          try {
            // Get detailed diff for each file with increased buffer
            const { stdout: diff } = await execAsync(`git diff --cached "${filename}"`, { maxBuffer: MAX_BUFFER });
            
            // Get file status (new, modified, deleted)
            const { stdout: status } = await execAsync(`git status --porcelain "${filename}"`, { maxBuffer: MAX_BUFFER });
            const fileStatus = status.trim().substring(0, 2);
            
            // Count additions and deletions
            const additions = (diff.match(/^\+(?!\+\+)/gm) || []).length;
            const deletions = (diff.match(/^-(?!--)/gm) || []).length;

            return {
              filename,
              diff,
              additions,
              deletions,
              status: this.parseGitStatus(fileStatus)
            };
          } catch (error) {
            console.error(`Error getting diff for ${filename}:`, error);
            throw new Error(`Failed to get diff for ${filename}`);
          }
        })
      );

      // If there are too many changes, summarize the diffs
      const totalChanges = changes.reduce((acc, curr) => acc + curr.diff.length, 0);
      if (totalChanges > 1000000) { // If total diff is more than 1MB
        return changes.map(change => ({
          ...change,
          diff: this.summarizeDiff(change.diff) // Summarize large diffs
        }));
      }

      return changes;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not a git repository')) {
        throw new Error('Not a git repository. Initialize git first with: git init');
      }
      throw error;
    }
  }

  private summarizeDiff(diff: string): string {
    const lines = diff.split('\n');
    if (lines.length > 100) {
      const firstLines = lines.slice(0, 50);
      const lastLines = lines.slice(-50);
      return [...firstLines, '...', `[${lines.length - 100} lines skipped]`, '...', ...lastLines].join('\n');
    }
    return diff;
  }

  private parseGitStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'A ': 'added',
      'M ': 'modified',
      'D ': 'deleted',
      'R ': 'renamed',
      'C ': 'copied',
      'U ': 'updated',
    };

    return statusMap[status] || 'modified';
  }

  async hasGitConfig(): Promise<boolean> {
    try {
      await execAsync('git config user.name', { maxBuffer: MAX_BUFFER });
      await execAsync('git config user.email', { maxBuffer: MAX_BUFFER });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { maxBuffer: MAX_BUFFER });
      return stdout.trim();
    } catch {
      throw new Error('Failed to get current branch');
    }
  }

  async getRecentCommits(count: number = 3): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git log -${count} --oneline`, { maxBuffer: MAX_BUFFER });
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}
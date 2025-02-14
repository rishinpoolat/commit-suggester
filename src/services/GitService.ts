import { exec } from 'child_process';
import { promisify } from 'util';
import { FileChange } from '../types';

const execAsync = promisify(exec);

export class GitService {
  async getStagedFiles(): Promise<FileChange[]> {
    try {
      // First check if we're in a git repository
      await execAsync('git rev-parse --is-inside-work-tree');

      // Get list of staged files
      const { stdout: stagedFiles } = await execAsync('git diff --cached --name-only');
      const files = stagedFiles.split('\n').filter(Boolean);

      if (files.length === 0) {
        throw new Error('No staged changes found. Use git add to stage your changes.');
      }

      const changes = await Promise.all(
        files.map(async (filename) => {
          try {
            // Get detailed diff for each file
            const { stdout: diff } = await execAsync(`git diff --cached "${filename}"`);
            
            // Get file status (new, modified, deleted)
            const { stdout: status } = await execAsync(`git status --porcelain "${filename}"`);
            const fileStatus = status.trim().substring(0, 2);
            
            const additions = (diff.match(/^\+/gm) || []).length;
            const deletions = (diff.match(/^-/gm) || []).length;

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

      return changes;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not a git repository')) {
        throw new Error('Not a git repository. Initialize git first with: git init');
      }
      throw error;
    }
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
      await execAsync('git config user.name');
      await execAsync('git config user.email');
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim();
    } catch {
      throw new Error('Failed to get current branch');
    }
  }

  async getRecentCommits(count: number = 3): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git log -${count} --oneline`);
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}
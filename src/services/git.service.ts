import { exec } from 'child_process';
import { promisify } from 'util';
import type { FileChange, GitFileStatus, ExecResult } from '../types';

const execAsync = promisify(exec);
const MAX_BUFFER = 1024 * 1024 * 10; // 10MB buffer

export class GitService {
  private readonly execOptions = { maxBuffer: MAX_BUFFER };

  async getStagedFiles(): Promise<FileChange[]> {
    try {
      await this.checkGitRepository();
      const files = await this.getStagedFileList();
      
      if (files.length === 0) {
        throw new Error('No staged changes found. Use git add to stage your changes.');
      }

      const changes = await Promise.all(files.map(file => this.getFileChanges(file)));
      return this.summarizeLargeChanges(changes);
    } catch (error) {
      this.handleGitError(error);
      throw error;
    }
  }

  private async checkGitRepository(): Promise<void> {
    try {
      await execAsync('git rev-parse --is-inside-work-tree', this.execOptions);
    } catch {
      throw new Error('Not a git repository. Initialize git first with: git init');
    }
  }

  private async getStagedFileList(): Promise<string[]> {
    const { stdout } = await execAsync('git diff --cached --name-only', this.execOptions);
    return stdout.split('\n').filter(Boolean);
  }

  private async getFileChanges(filename: string): Promise<FileChange> {
    try {
      const [diff, status] = await Promise.all([
        this.getFileDiff(filename),
        this.getFileStatus(filename)
      ]);

      return {
        filename,
        diff,
        additions: this.countChanges(diff, /^\+(?!\+\+)/gm),
        deletions: this.countChanges(diff, /^-(?!--)/gm),
        status: this.parseGitStatus(status)
      };
    } catch (error) {
      throw new Error(`Failed to get changes for ${filename}: ${error.message}`);
    }
  }

  private async getFileDiff(filename: string): Promise<string> {
    const { stdout } = await execAsync(`git diff --cached "${filename}"`, this.execOptions);
    return stdout;
  }

  private async getFileStatus(filename: string): Promise<string> {
    const { stdout } = await execAsync(`git status --porcelain "${filename}"`, this.execOptions);
    return stdout.trim().substring(0, 2);
  }

  private countChanges(diff: string, pattern: RegExp): number {
    return (diff.match(pattern) || []).length;
  }

  private parseGitStatus(status: string): GitFileStatus {
    const statusMap: Record<string, GitFileStatus> = {
      'A ': 'added',
      'M ': 'modified',
      'D ': 'deleted',
      'R ': 'renamed',
      'C ': 'copied',
      'U ': 'updated'
    };

    return statusMap[status] || 'modified';
  }

  private summarizeLargeChanges(changes: FileChange[]): FileChange[] {
    const totalChanges = changes.reduce((acc, curr) => acc + curr.diff.length, 0);
    if (totalChanges <= 1000000) return changes;

    return changes.map(change => ({
      ...change,
      diff: this.summarizeDiff(change.diff)
    }));
  }

  private summarizeDiff(diff: string): string {
    const lines = diff.split('\n');
    if (lines.length <= 100) return diff;

    const firstLines = lines.slice(0, 50);
    const lastLines = lines.slice(-50);
    return [
      ...firstLines,
      '...',
      `[${lines.length - 100} lines skipped]`,
      '...',
      ...lastLines
    ].join('\n');
  }

  async hasGitConfig(): Promise<boolean> {
    try {
      await Promise.all([
        execAsync('git config user.name', this.execOptions),
        execAsync('git config user.email', this.execOptions)
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', this.execOptions);
      return stdout.trim();
    } catch {
      throw new Error('Failed to get current branch');
    }
  }

  async getRecentCommits(count: number = 3): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git log -${count} --oneline`, this.execOptions);
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  async commitChanges(message: string): Promise<void> {
    try {
      // Check if there are staged changes
      const { stdout: staged } = await execAsync('git diff --cached --quiet || echo "has changes"', this.execOptions);
      
      if (!staged) {
        throw new Error('No changes staged for commit. Use git add to stage your changes.');
      }

      // Escape quotes in commit message
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${escapedMessage}"`, this.execOptions);
    } catch (error) {
      this.handleGitError(error);
      throw error;
    }
  }

  private handleGitError(error: unknown): void {
    if (error instanceof Error) {
      if (error.message.includes('not a git repository')) {
        throw new Error('Not a git repository. Initialize git first with: git init');
      } else if (error.message.includes('please tell me who you are')) {
        throw new Error('Git user not configured. Run:\ngit config --global user.email "you@example.com"\ngit config --global user.name "Your Name"');
      }
    }
  }
}
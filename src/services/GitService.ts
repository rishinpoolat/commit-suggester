import { exec } from 'child_process';
import { promisify } from 'util';
import type { FileChange, GitFileStatus } from '../types';

const execAsync = promisify(exec);

export class GitService {
  async getAllChanges(): Promise<FileChange[]> {
    try {
      // Check if we're in a git repository
      await execAsync('git rev-parse --is-inside-work-tree');
      
      // Check git config
      await this.checkGitConfig();
      
      // Stage all changes first (git add .)
      console.log('📦 Staging all changes...');
      await execAsync('git add .');
      
      // Get staged files
      const { stdout: stagedFiles } = await execAsync('git diff --cached --name-status');
      
      if (!stagedFiles.trim()) {
        throw new Error('No changes found to commit. Make some changes to your files first.');
      }

      const changes = await Promise.all(
        stagedFiles.trim().split('\n').map(line => this.getFileChange(line))
      );

      return changes.filter(Boolean);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not a git repository')) {
          throw new Error('❌ Not a git repository. Run: git init');
        }
        if (error.message.includes('please tell me who you are')) {
          throw new Error('❌ Git user not configured. Run:\ngit config --global user.email "you@example.com"\ngit config --global user.name "Your Name"');
        }
      }
      throw error;
    }
  }

  private async getFileChange(statusLine: string): Promise<FileChange> {
    const [status, filename] = statusLine.split('\t');
    
    try {
      const { stdout: diff } = await execAsync(`git diff --cached -- "${filename}"`);
      
      // Count additions and deletions
      const additions = (diff.match(/^\+(?!\+\+)/gm) || []).length;
      const deletions = (diff.match(/^-(?!--)/gm) || []).length;

      return {
        filename,
        diff: diff.length > 3000 ? diff.slice(0, 3000) + '\n... (truncated)' : diff,
        additions,
        deletions,
        status: this.parseStatus(status) as GitFileStatus
      };
    } catch (error) {
      console.warn(`⚠️  Could not get diff for ${filename}`);
      return {
        filename,
        diff: 'Could not retrieve diff',
        additions: 0,
        deletions: 0,
        status: 'modified' as GitFileStatus
      };
    }
  }

  private parseStatus(status: string): string {
    switch (status) {
      case 'A': return 'added';
      case 'M': return 'modified';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      case 'C': return 'copied';
      default: return 'modified';
    }
  }

  private async checkGitConfig(): Promise<void> {
    try {
      await execAsync('git config user.name');
      await execAsync('git config user.email');
    } catch {
      throw new Error('Git user not configured');
    }
  }

  async commit(message: string): Promise<void> {
    try {
      // Escape quotes and commit
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${escapedMessage}"`);
      console.log('✅ Committed successfully!');
    } catch (error) {
      throw new Error(`Failed to commit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatus(): Promise<{ staged: number; unstaged: number; untracked: number }> {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      const lines = stdout.trim().split('\n').filter(Boolean);
      
      let staged = 0, unstaged = 0, untracked = 0;
      
      for (const line of lines) {
        const stagedStatus = line[0];
        const unstagedStatus = line[1];
        
        if (stagedStatus !== ' ' && stagedStatus !== '?') staged++;
        if (unstagedStatus !== ' ') unstaged++;
        if (line.startsWith('??')) untracked++;
      }
      
      return { staged, unstaged, untracked };
    } catch {
      return { staged: 0, unstaged: 0, untracked: 0 };
    }
  }
}
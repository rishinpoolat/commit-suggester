import { exec } from 'child_process';
import { promisify } from 'util';
import { FileChange } from '../types';

const execAsync = promisify(exec);

export class GitService {
  async getStagedFiles(): Promise<FileChange[]> {
    try {
      // Get list of staged files
      const { stdout: stagedFiles } = await execAsync('git diff --cached --name-only');
      const files = stagedFiles.split('\n').filter(Boolean);

      console.log('Staged files:', files); // Debug log

      return Promise.all(
        files.map(async (filename) => {
          try {
            const { stdout: diff } = await execAsync(`git diff --cached "${filename}"`);
            const additions = (diff.match(/^\+/gm) || []).length;
            const deletions = (diff.match(/^-/gm) || []).length;

            return {
              filename,
              diff,
              additions,
              deletions
            };
          } catch (error) {
            console.error(`Error getting diff for ${filename}:`, error);
            return {
              filename,
              diff: '',
              additions: 0,
              deletions: 0
            };
          }
        })
      );
    } catch (error) {
      console.error('Error getting staged files:', error);
      return [];
    }
  }
}
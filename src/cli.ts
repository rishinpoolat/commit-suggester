#!/usr/bin/env node

import { CommitSuggester } from './CommitSuggester';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import chalk from 'chalk';

async function main() {
  try {
    // Load environment variables
    dotenv.config({ path: path.join(process.cwd(), '.env') });
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log(chalk.red('Error: GEMINI_API_KEY not found'));
      console.log(chalk.yellow('Create a .env file with GEMINI_API_KEY=your_key_here'));
      process.exit(1);
    }

    // Check for staged files
    try {
      const stagedFiles = execSync('git diff --staged --name-only', { encoding: 'utf8' });
      if (!stagedFiles.trim()) {
        console.log(chalk.yellow('No staged changes. Use git add first.'));
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red('Error checking git status. Are you in a git repository?'));
      process.exit(1);
    }

    const suggester = new CommitSuggester({ apiKey });
    const suggestions = await suggester.getSuggestions();

    const choices = [
      ...suggestions.map((msg, i) => ({
        name: `${i + 1}. ${msg}`,
        value: msg
      })),
      new inquirer.Separator(),
      {
        name: 'Write custom message',
        value: 'custom'
      }
    ];

    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Choose commit message:',
      choices
    }]);

    let commitMessage = selected;
    if (selected === 'custom') {
      const { custom } = await inquirer.prompt([{
        type: 'input',
        name: 'custom',
        message: 'Enter commit message:',
        validate: (input: string) => input.length > 0 || 'Message cannot be empty'
      }]);
      commitMessage = custom;
    }

    // Commit changes using execSync
    console.log(chalk.blue('\nCommitting changes...'));
    const escapedMessage = commitMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${escapedMessage}"`, { stdio: 'inherit' });
    console.log(chalk.green('Successfully committed!'));

  } catch (error) {
    console.log(chalk.red('Error:', error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

main().catch(error => {
  console.log(chalk.red('Fatal error:', error));
  process.exit(1);
});
#!/usr/bin/env bun
import { CommitSuggester } from './CommitSuggester';
import inquirer from 'inquirer';
import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';

interface CommitChoice {
  name: string;
  value: string;
  short?: string;
}

const getApiKey = (): string => {
  const globalConfigPath = join(homedir(), '.config', 'commit-suggester', '.env');
  
  if (existsSync(globalConfigPath)) {
    config({ path: globalConfigPath });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Gemini API key not found. Please set it up:\n\n' +
      '1. Get your API key from https://makersuite.google.com/app/apikey\n' +
      '2. Create config directory:\n' +
      '   mkdir -p ~/.config/commit-suggester\n' +
      '3. Save your API key:\n' +
      '   echo "GEMINI_API_KEY=your_key_here" > ~/.config/commit-suggester/.env'
    );
  }

  return apiKey;
};

const main = async (): Promise<void> => {
  try {
    const suggester = new CommitSuggester({ apiKey: getApiKey() });
    const suggestions = await suggester.getSuggestions();

    const choices: CommitChoice[] = [
      ...suggestions.map((message: string, index: number) => ({
        name: chalk.green(`${index + 1}. ${message}`),
        value: message,
        short: message
      })),
      {
        name: chalk.yellow('✎ Write custom commit message'),
        value: 'custom',
        short: 'Custom message'
      }
    ];

    const { selectedCommit } = await inquirer.prompt<{ selectedCommit: string }>([{
      type: 'list',
      name: 'selectedCommit',
      message: 'Select a commit message:',
      choices,
      pageSize: 10,
      prefix: '🔍'
    }]);

    if (selectedCommit === 'custom') {
      const { customMessage } = await inquirer.prompt<{ customMessage: string }>([{
        type: 'input',
        name: 'customMessage',
        message: '✏️  Enter your commit message:',
        validate: (input: string) => {
          if (!input.trim()) return 'Commit message cannot be empty';
          return true;
        }
      }]);
      
      await suggester.commitChanges(customMessage);
      console.log(chalk.green('✓ Successfully committed changes!'));
    } else {
      await suggester.commitChanges(selectedCommit);
      console.log(chalk.green('✓ Successfully committed changes!'));
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'An unknown error occurred');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(chalk.red('Fatal Error:'), error);
  process.exit(1);
});
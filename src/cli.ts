#!/usr/bin/env bun
import { CommitSuggester } from './CommitSuggester';
import inquirer from 'inquirer';
import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';

const getApiKey = (): string => {
  // Check global config first
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

const main = async () => {
  try {
    const apiKey = getApiKey();
    const suggester = new CommitSuggester({ apiKey });
    const suggestions = await suggester.getSuggestions();

    const choices = [
      ...suggestions.map((msg, index) => ({
        name: chalk.green(`${index + 1}. ${msg}`),
        value: msg,
        short: msg
      })),
      { 
        name: chalk.yellow('✎ Write custom commit message'),
        value: 'custom',
        short: 'Custom message'
      }
    ];

    const { selectedCommit } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedCommit',
      message: 'Select a commit message:',
      choices,
      pageSize: 10,
      prefix: '🔍'
    }]);

    if (selectedCommit === 'custom') {
      const { customMessage } = await inquirer.prompt([{
        type: 'input',
        name: 'customMessage',
        message: '✏️  Enter your commit message:',
        validate: (input) => {
          if (!input.trim()) return 'Commit message cannot be empty';
          return true;
        }
      }]);
      
      await suggester.commitChanges(customMessage);
    } else {
      await suggester.commitChanges(selectedCommit);
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};

main();
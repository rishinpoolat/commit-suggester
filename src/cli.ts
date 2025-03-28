#!/usr/bin/env bun
import { CommitSuggester } from './CommitSuggester';
import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { 
  spinners, 
  format, 
  displayWelcomeBanner, 
  promptForCommitMessage, 
  confirmCommit,
  showCommitSuccess,
  displayCommitSummary
} from './cli-utils';

const getApiKey = (): string => {
  const globalConfigPath = join(homedir(), '.config', 'commit-suggester', '.env');
  
  if (existsSync(globalConfigPath)) {
    config({ path: globalConfigPath });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      format.box(
        format.error('Gemini API key not found. Please set it up:\n\n') +
        format.bullet('Get your API key from https://ai.google.dev/tutorials/setup\n') +
        format.bullet('Create config directory:\n') +
        format.dim('   mkdir -p ~/.config/commit-suggester\n') +
        format.bullet('Save your API key:\n') +
        format.dim('   echo "GEMINI_API_KEY=your_key_here" > ~/.config/commit-suggester/.env'),
        'API Key Required'
      )
    );
  }

  return apiKey;
};

const main = async (): Promise<void> => {
  try {
    // Display welcome banner
    displayWelcomeBanner();
    
    // Initialize
    spinners.loading.start();
    spinners.loading.text = format.info('Initializing and staging all changes...');
    const suggester = new CommitSuggester({ apiKey: getApiKey() });
    spinners.loading.succeed(format.success('Commit suggester initialized and changes staged'));
    
    // Get staged files info
    spinners.generating.start();
    const { suggestions, stats } = await suggester.getSuggestionsWithStats();
    spinners.generating.succeed(format.success(`Generated ${suggestions.length} commit suggestions`));
    
    // Display stats
    if (stats) {
      displayCommitSummary(stats.files, stats.additions, stats.deletions);
    }
    
    // Format suggestions for display with explanations
    const formattedSuggestions = suggestions.map(message => ({ message }));
    
    // Get user selection
    const selectedMessage = await promptForCommitMessage(formattedSuggestions);
    
    // Confirm commit
    const confirmed = await confirmCommit(selectedMessage);
    if (!confirmed) {
      console.log(format.info('\nCommit cancelled. Exiting...'));
      process.exit(0);
    }
    
    // Perform commit
    spinners.committing.start();
    await suggester.commitChanges(selectedMessage);
    spinners.committing.succeed();
    
    // Show success message
    showCommitSuccess(selectedMessage);

  } catch (error) {
    // Stop any running spinners
    Object.values(spinners).forEach(spinner => {
      if (spinner.isSpinning) {
        spinner.fail();
      }
    });
    
    console.error('\n' + format.error('Error: ') + (error instanceof Error ? error.message : 'An unknown error occurred'));
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(chalk.red('Fatal Error:'), error);
  process.exit(1);
});
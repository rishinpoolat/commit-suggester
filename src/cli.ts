#!/usr/bin/env bun
import { CommitSuggester } from './CommitSuggester';
import chalk from 'chalk';
import inquirer from 'inquirer';

const isInteractiveMode = process.argv.includes('-i') || process.argv.includes('--interactive');
const showHelp = process.argv.includes('-h') || process.argv.includes('--help');

const printHelp = () => {
  console.log(chalk.cyan('\n🚀 Commit Suggester - AI-powered Git Commits\n'));
  console.log('Usage:');
  console.log(`  ${chalk.green('commit-suggester')}           ${chalk.dim('# Auto-select best commit message')}`);
  console.log(`  ${chalk.green('commit-suggester -i')}        ${chalk.dim('# Interactive mode (3 options + custom)')}`);
  console.log(`  ${chalk.green('commit-suggester --help')}    ${chalk.dim('# Show this help')}\n`);
  console.log('Setup:');
  console.log(`  ${chalk.yellow('export GROQ_API_KEY="your_key"')}      ${chalk.dim('# Recommended - Fast & Free')}`);
  console.log(`  ${chalk.yellow('export OPENAI_API_KEY="your_key"')}    ${chalk.dim('# Alternative')}`);
  console.log(`  ${chalk.yellow('export ANTHROPIC_API_KEY="your_key"')} ${chalk.dim('# Alternative')}\n`);
};

const main = async (): Promise<void> => {
  if (showHelp) {
    printHelp();
    return;
  }

  try {
    console.log(chalk.cyan('\n🚀 Commit Suggester - AI-powered Git Commits\n'));
    
    const suggester = new CommitSuggester();
    
    // Get change summary
    console.log(chalk.blue('📊 Analyzing changes...'));
    const summary = await suggester.getChangeSummary();
    console.log(chalk.green(`✅ Found ${summary.files} file(s): +${summary.additions}/-${summary.deletions}\n`));
    
    // Get AI suggestions
    console.log(chalk.blue('🤖 Generating commit suggestions...\n'));
    const suggestions = await suggester.getSuggestions();

    let finalMessage: string;

    if (isInteractiveMode) {
      // Interactive mode: show options
      console.log(chalk.cyan('📋 Interactive Mode - Choose your commit message:\n'));
      
      const choices = [
        ...suggestions.map((msg, i) => ({
          name: `${chalk.cyan(`[${i + 1}]`)} ${msg}`,
          value: msg,
          short: msg
        })),
        {
          name: chalk.yellow('✏️  Write custom message'),
          value: 'custom',
          short: 'Custom'
        }
      ];

      const { selectedMessage } = await inquirer.prompt({
        type: 'list',
        name: 'selectedMessage',
        message: 'Select a commit message:',
        choices,
        pageSize: 10
      });

      if (selectedMessage === 'custom') {
        const { customMessage } = await inquirer.prompt({
          type: 'input',
          name: 'customMessage',
          message: 'Enter your commit message:',
          validate: (input: string) => input.trim() ? true : 'Commit message cannot be empty'
        });
        finalMessage = customMessage;
      } else {
        finalMessage = selectedMessage;
      }

      // Confirm in interactive mode
      const { confirmed } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmed',
        message: `Commit with: "${chalk.bold(finalMessage)}"?`,
        default: true
      });

      if (!confirmed) {
        console.log(chalk.yellow('\n❌ Commit cancelled'));
        return;
      }
    } else {
      // Auto mode: use best suggestion
      finalMessage = suggestions[0];
      console.log(chalk.green(`🎯 Auto-selected: "${chalk.bold(finalMessage)}"`));
    }

    console.log(chalk.blue('\n📝 Committing changes...'));
    await suggester.commit(finalMessage);
    console.log(chalk.green(`\n🎉 Successfully committed: "${finalMessage}"`));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(chalk.red('Fatal Error:'), error);
  process.exit(1);
});
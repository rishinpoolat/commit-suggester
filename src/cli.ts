#!/usr/bin/env bun
import { CommitSuggester } from './CommitSuggester';
import chalk from 'chalk';
import inquirer from 'inquirer';

const args = process.argv.slice(2);
const isInteractiveMode = args.includes('-i') || args.includes('--interactive');
const showHelp = args.includes('-h') || args.includes('--help');
const isDryRun = args.includes('-d') || args.includes('--dry-run');
const stagedOnly = args.includes('-s') || args.includes('--staged');
const shouldPush = args.includes('-p') || args.includes('--push');

const printHelp = () => {
  console.log(chalk.cyan('\n🚀 Commit Suggester - AI-powered Git Commits\n'));
  console.log('Usage:');
  console.log(`  ${chalk.green('commit-suggester')}              ${chalk.dim('# Auto-select best commit message')}`);
  console.log(`  ${chalk.green('commit-suggester -i')}           ${chalk.dim('# Interactive mode (3 options + custom)')}`);
  console.log(`  ${chalk.green('commit-suggester -d, --dry-run')} ${chalk.dim('# Preview suggestions without committing')}`);
  console.log(`  ${chalk.green('commit-suggester -s, --staged')}  ${chalk.dim('# Only use already staged changes')}`);
  console.log(`  ${chalk.green('commit-suggester -p, --push')}    ${chalk.dim('# Push to remote after committing')}`);
  console.log(`  ${chalk.green('commit-suggester --help')}        ${chalk.dim('# Show this help')}\n`);
  console.log('Options can be combined:');
  console.log(`  ${chalk.green('commit-suggester -i -d')}         ${chalk.dim('# Interactive + dry run')}`);
  console.log(`  ${chalk.green('commit-suggester -i -s')}         ${chalk.dim('# Interactive + staged only')}`);
  console.log(`  ${chalk.green('commit-suggester -i -p')}         ${chalk.dim('# Interactive + push after commit')}\n`);
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

    if (isDryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no commit will be made\n'));
    }

    const suggester = new CommitSuggester({ stagedOnly });

    // Validate API key before touching git
    suggester.validateAI();

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

    if (isDryRun) {
      console.log(chalk.yellow(`\n🔍 Dry run - would commit: "${finalMessage}"`));
      console.log(chalk.dim('Run without --dry-run to actually commit.'));
    } else {
      console.log(chalk.blue('\n📝 Committing changes...'));
      await suggester.commit(finalMessage);
      console.log(chalk.green(`\n🎉 Successfully committed: "${finalMessage}"`));

      if (shouldPush) {
        console.log(chalk.blue('\n📤 Pushing to remote...'));
        await suggester.push();
        console.log(chalk.green('✅ Pushed successfully!'));
      }
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(chalk.red('Fatal Error:'), error);
  process.exit(1);
});
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import figures from 'figures';

// Type definitions
interface CommitChoice {
  name: string;
  value: string;
  short?: string;
  explanation?: string;
}

// Spinner instances
export const spinners = {
  loading: ora({
    text: chalk.blue('Starting commit-suggester...'),
    spinner: 'dots',
    color: 'blue',
  }),
  generating: ora({
    text: chalk.blue('Connecting to Gemini API...'),
    spinner: 'moon',
    color: 'cyan',
  }),
  committing: ora({
    text: chalk.blue('Committing changes...'),
    spinner: 'arc',
    color: 'green',
  }),
};

// Update spinner text for different stages
export const updateSpinnerText = (stage: 'start' | 'model' | 'processing' | 'parsing') => {
  switch(stage) {
    case 'start':
      spinners.generating.text = chalk.blue('Connecting to Gemini API...');
      break;
    case 'model':
      spinners.generating.text = chalk.blue(`Using model: ${chalk.cyan(getCurrentModel())}`);
      break;
    case 'processing':
      spinners.generating.text = chalk.blue('Processing changes and generating suggestions...');
      break;
    case 'parsing':
      spinners.generating.text = chalk.blue('Parsing AI response...');
      break;
  }
};

// External variable to store current model name
let currentModelName = 'unknown';

// Function to set current model
export const setCurrentModel = (model: string) => {
  currentModelName = model;
};

// Function to get current model
export const getCurrentModel = (): string => {
  return currentModelName;
};

// Format utility functions
export const format = {
  success: (text: string): string => chalk.green(text),
  error: (text: string): string => chalk.red(text),
  info: (text: string): string => chalk.blue(text),
  warning: (text: string): string => chalk.yellow(text),
  highlight: (text: string): string => chalk.cyan(text),
  dim: (text: string): string => chalk.dim(text),
  box: (text: string, title?: string): string => {
    const width = Math.max(...text.split('\n').map(line => line.length));
    const horizontalBorder = '─'.repeat(width + 2);
    const titlePart = title ? ` ${title} ` : '';
    const topBorder = title 
      ? `┌${titlePart}${'─'.repeat(Math.max(0, width + 2 - titlePart.length))}┐`
      : `┌${horizontalBorder}┐`;
    
    const wrappedText = text.split('\n')
      .map(line => `│ ${line}${' '.repeat(Math.max(0, width - line.length))} │`)
      .join('\n');
    
    return chalk.cyan(`${topBorder}\n${wrappedText}\n└${horizontalBorder}┘`);
  },
  bullet: (text: string): string => `${chalk.cyan('•')} ${text}`,
  checkmark: (text: string): string => `${chalk.green(figures.tick)} ${text}`,
  cross: (text: string): string => `${chalk.red(figures.cross)} ${text}`,
  arrow: (text: string): string => `${chalk.blue(figures.arrowRight)} ${text}`,
};

// Display welcome banner
export const displayWelcomeBanner = (): void => {
  console.log('\n');
  console.log(format.box(
`   ╔═══════════════════════════════╗   
   ║      COMMIT SUGGESTER         ║   
   ╚═══════════════════════════════╝   `,
    'AI-powered Git Commits'
  ));
  console.log('\n');
};

// Display commit summary
export const displayCommitSummary = (numFiles: number, numAdditions: number, numDeletions: number): void => {
  console.log(format.box(
    `${format.bullet(`Files changed: ${format.highlight(numFiles.toString())}`)}
${format.bullet(`Additions: ${format.success('+' + numAdditions.toString())}`)}
${format.bullet(`Deletions: ${format.error('-' + numDeletions.toString())}`)}`,
    'Changes Summary'
  ));
};

// Display suggestions with explanations
export const displaySuggestions = (suggestions: Array<{ message: string, explanation?: string }>): void => {
  console.log(format.box(
    suggestions.map((suggestion, index) => 
      `${format.highlight(`[${index + 1}]`)} ${suggestion.message}\n` +
      (suggestion.explanation ? `    ${format.dim(suggestion.explanation)}\n` : '')
    ).join('\n'),
    'AI-Generated Commit Suggestions'
  ));
};

// Interactive commit message selection
export const promptForCommitMessage = async (suggestions: Array<{ message: string, explanation?: string }>): Promise<string> => {
  const choices: CommitChoice[] = [
    ...suggestions.map((suggestion, index) => ({
      name: `${chalk.cyan(`[${index + 1}]`)} ${suggestion.message}\n${suggestion.explanation ? `    ${chalk.dim(suggestion.explanation)}` : ''}`,
      value: suggestion.message,
      short: suggestion.message
    })),
    {
      name: `${chalk.yellow(`[✎]`)} Write custom commit message`,
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
    prefix: `${chalk.cyan('>')}`,
    loop: false
  }]);

  if (selectedCommit === 'custom') {
    const { customMessage } = await inquirer.prompt<{ customMessage: string }>([{
      type: 'input',
      name: 'customMessage',
      message: `${chalk.yellow('✎')}  Enter your commit message:`,
      validate: (input: string) => {
        if (!input.trim()) return 'Commit message cannot be empty';
        return true;
      }
    }]);
    
    return customMessage;
  }
  
  return selectedCommit;
};

// Confirm commit
export const confirmCommit = async (message: string): Promise<boolean> => {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([{
    type: 'confirm',
    name: 'confirmed',
    message: `${chalk.cyan('?')} Confirm commit with message:\n  "${chalk.bold(message)}"`,
    default: true
  }]);
  
  return confirmed;
};

// Show commit success
export const showCommitSuccess = (message: string): void => {
  console.log('\n' + format.box(
    `${format.checkmark('Commit successful!')}\n\n${chalk.bold(message)}`,
    'Commit Complete'
  ));
};

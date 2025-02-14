# Commit Suggester 🤖

AI-powered git commit message generator using Google's Gemini AI. Get intelligent, conventional commit message suggestions for your changes instantly.

## Features ✨

- 🎯 Generate context-aware conventional commit messages
- 💡 3 AI-generated suggestions for each commit
- ✍️ Option to write custom messages
- 🎨 Beautiful, interactive CLI interface
- 🔄 Seamless integration with your git workflow
- 📝 Follows [Conventional Commits](https://www.conventionalcommits.org/) specification

## Prerequisites

- [Bun](https://bun.sh) installed on your system
- Git initialized repository
- [Gemini API key](https://makersuite.google.com/app/apikey)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/rishinpoolat/commit-suggester.git
cd commit-suggester
```

2. Install dependencies:
```bash
bun install
```

3. Set up your Gemini API key:
```bash
# Create config directory
mkdir -p ~/.config/commit-suggester

# Add your API key
echo "GEMINI_API_KEY=your_api_key_here" > ~/.config/commit-suggester/.env
```

4. Build and install globally:
```bash
bun run build
bun link
```

Now you can use \`commit-suggester\` in any git repository!

## Usage

### Basic Usage

In any git repository:

1. Stage your changes:
```bash
git add .
```

2. Get commit suggestions:
```bash
commit-suggester
```

3. Select from:
   - 3 AI-generated suggestions (numbered 1-3)
   - Option to write your own custom message

### Example

\`\`\`
$ commit-suggester
🔍 Select a commit message:
  1. feat(button): add hover state styling
  2. style(css): update button color scheme
  3. refactor(components): simplify button props
  ✎ Write custom commit message
\`\`\`

### Commit Types

The suggestions follow conventional commit format:

- \`feat\`: New features
- \`fix\`: Bug fixes
- \`docs\`: Documentation changes
- \`style\`: Code style changes (formatting, etc.)
- \`refactor\`: Code refactoring
- \`test\`: Adding or modifying tests
- \`chore\`: Maintenance tasks

## Development

Want to contribute? Here's how to set up the project for development:

```bash
# Clone the repository
git clone https://github.com/rishinpoolat/commit-suggester.git
cd commit-suggester

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the project
bun run build
```

## Troubleshooting

### API Key Issues

If you see "Gemini API key not found" error:
1. Make sure you have created the config directory:
   ```bash
   mkdir -p ~/.config/commit-suggester
   ```
2. Check if your API key is set correctly:
   ```bash
   cat ~/.config/commit-suggester/.env
   ```
3. Ensure the format is exactly:
   ```
   GEMINI_API_KEY=your_key_here
   ```

### Git Issues

Make sure:
- You're in a git repository (\`git init\` if needed)
- You have staged changes (\`git add .\`)
- Git user is configured:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google's Gemini AI for powering the suggestions
- [Conventional Commits](https://www.conventionalcommits.org/) for the commit message specification
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for the interactive CLI
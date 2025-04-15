# Commit Suggester

A TypeScript-based CLI tool that uses Google's Gemini AI to suggest meaningful conventional commit messages for your git changes.

## Features

- 🤖 AI-powered commit message generation
- 📝 Follows [Conventional Commits](https://www.conventionalcommits.org/) specification
- 🎯 Analyzes git diffs for context-aware suggestions
- 🔍 Smart scope detection based on file types
- ✨ Interactive CLI with color-coded suggestions
- ✅ Option to write custom commit messages
- 🚀 Automatically stages all changes (`git add .`)

## Prerequisites

- [Bun](https://bun.sh) installed on your system
- Git initialized repository
- [Gemini API key](https://makersuite.google.com/app/apikey)

## Installation

1. Clone the repository:
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

Now you can use `commit-suggester` in any git repository!

## Usage

1. Make changes to your files

2. Run the commit-suggester tool:
```bash
commit-suggester
```

The tool will automatically stage all your changes (equivalent to `git add .`) and then generate commit suggestions.

3. Select from:
   - Three AI-generated suggestions
   - Option to write your own custom message

Example output:
```
🔍 Select a commit message:
  1. feat(auth): add user authentication
  2. fix(api): resolve login endpoint error
  3. refactor(utils): simplify auth helpers
  ✎ Write custom commit message
```

## Commit Types

The tool generates suggestions using these conventional commit types:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

## Development

Want to contribute? Here's how to set up the project for development:

```bash
# Clone the repository
git clone https://github.com/rishinpoolat/commit-suggester.git
cd commit-suggester

# Install dependencies
bun install

# Build the project
bun run build

# Link for local testing
bun link
```

## Project Structure

```
src/
├── cli.ts              # Command-line interfaces
├── commit-suggester.ts # Main class
├── services/          
│   ├── ai.service.ts   # Gemini AI integration
│   └── git.service.ts  # Git operations
└── types/
    └── index.ts        # TypeScript types
```

## Troubleshooting

### API Key Issues

If you see "Gemini API key not found":
1. Get your API key from [Google MakerSuite](https://makersuite.google.com/app/apikey)
2. Create the config directory:
   ```bash
   mkdir -p ~/.config/commit-suggester
   ```
3. Save your API key:
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > ~/.config/commit-suggester/.env
   ```

### Git Issues

Make sure:
- You're in a git repository (`git init` if needed)
- You have made some changes to your files
- Git user is configured:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [Google's Gemini AI](https://deepmind.google/technologies/gemini/) for powering the suggestions
- [Conventional Commits](https://www.conventionalcommits.org/) for the commit message specification
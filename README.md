# AI Commit Suggester

An AI-powered Git commit message suggester using Google's Gemini API. This tool helps you write better commit messages by providing AI-generated suggestions based on your staged changes.

## Features

- AI-powered commit message suggestions using Gemini API
- Follows conventional commit format
- Interactive CLI interface
- Option for custom commit messages
- Analyzes git diff to provide context-aware suggestions

## Prerequisites

- Node.js (v14 or higher)
- Git
- Google Gemini API key

## Installation

### Global Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/commit-suggester.git

# Navigate to the directory
cd commit-suggester

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### Project-specific Installation

```bash
npm install --save-dev ai-commit-suggester
```

## Configuration

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Create a `.env` file in your project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. Stage your changes as usual:
```bash
git add .
```

2. Instead of `git commit -m "message"`, simply run:
```bash
commit
```

3. You'll see an interactive prompt with:
   - 3 AI-suggested commit messages
   - Option to write your own message

4. Use arrow keys to select a suggestion or write your own

5. Press Enter to commit with the selected message

## Example

```bash
$ git add .
$ commit

Select a commit message:
❯ 1. feat(auth): implement user authentication
  2. feat(core): add login functionality
  3. test(auth): add unit tests
  ──────────────
  Write custom message
```

## Commit Message Format

The tool follows the conventional commit format:

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
```

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/commit-suggester.git

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using the tool itself! (`commit`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details
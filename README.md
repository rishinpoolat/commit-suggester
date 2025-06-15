# Commit Suggester

A simple CLI tool that uses AI to generate conventional commit messages for your git changes.

## Features

- 🤖 **Multiple AI Providers** - Groq, OpenAI, Anthropic, Google Gemini
- 🚀 **Auto-staging** - Automatically stages all changes before analysis
- ⚡ **Simple Setup** - Just set environment variables
- 🎯 **Smart Analysis** - Analyzes your actual git diffs
- 📝 **Conventional Commits** - Follows standard format
- ✨ **Interactive** - Choose from 3 AI suggestions or write custom

## Quick Setup

1. **Install dependencies:**
```bash
bun install
```

2. **Set your AI API key** (choose one):
```bash
# Recommended - Groq (fast & free)
export GROQ_API_KEY="your_groq_key_here"

# Or use others
export OPENAI_API_KEY="your_openai_key_here"
export ANTHROPIC_API_KEY="your_anthropic_key_here"  
export GOOGLE_GENERATIVE_AI_API_KEY="your_google_key_here"

# Add to your shell profile
echo 'export GROQ_API_KEY="your_key"' >> ~/.zshrc
source ~/.zshrc
```

3. **Build & Install:**
```bash
bun run build
bun link
```

## Get API Keys

- **Groq** (Recommended): [console.groq.com/keys](https://console.groq.com/keys) - Fast & Free
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **Google**: [ai.google.dev/tutorials/setup](https://ai.google.dev/tutorials/setup)

## Usage

### **Auto Mode (Default)**
```bash
# Make your changes
echo "console.log('hello')" > test.js

# Auto-commit with best suggestion
commit-suggester
```

**Output:**
```
🚀 Commit Suggester - AI-powered Git Commits

📦 Staging all changes...
📊 Analyzing changes...
✅ Found 1 file(s): +1/-0

🤖 Using GROQ AI (llama-3.3-70b-versatile)
🤖 Generating commit suggestions...

🎯 Auto-selected: "feat: add hello world console log"

📝 Committing changes...
✅ Committed successfully!

🎉 Successfully committed: "feat: add hello world console log"
```

### **Interactive Mode**
```bash
# Choose from 3 options + custom
commit-suggester -i
```

**Output:**
```
🚀 Commit Suggester - AI-powered Git Commits

📦 Staging all changes...
📊 Analyzing changes...
✅ Found 1 file(s): +1/-0

🤖 Using GROQ AI (llama-3.3-70b-versatile)
🤖 Generating commit suggestions...

📋 Interactive Mode - Choose your commit message:

? Select a commit message:
❯ [1] feat: add hello world console log
  [2] chore: create test javascript file  
  [3] feat(test): add basic console output
  ✏️  Write custom message

? Commit with: "feat: add hello world console log"? Yes

📝 Committing changes...
✅ Committed successfully!

🎉 Successfully committed: "feat: add hello world console log"
```

### **Help**
```bash
commit-suggester --help
```

## How it Works

### **Auto Mode:**
1. **Auto-stages** all your changes (`git add .`)
2. **Analyzes** git diffs to understand what changed  
3. **Generates** 3 AI suggestions (best one first)
4. **Auto-commits** with the best suggestion

### **Interactive Mode (-i):**
1. **Auto-stages** all your changes (`git add .`)
2. **Analyzes** git diffs to understand what changed
3. **Shows** 3 AI suggestions + custom option
4. **Interactive** selection with confirmation
5. **Commits** with your chosen message

## Supported Commit Types

- `feat`: New features
- `fix`: Bug fixes  
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance improvements

## Project Structure

```
src/
├── cli.ts              # Main CLI interface
├── CommitSuggester.ts  # Core logic
├── services/
│   ├── AIService.ts    # AI provider handling
│   └── GitService.ts   # Git operations
└── types/
    └── index.ts        # TypeScript types
```

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Type check
bun run typecheck
```

## License

MIT - See [LICENSE](LICENSE) file for details.
# Commit Suggester

A simple CLI tool that uses AI to generate conventional commit messages for your git changes.

## Features

- 🤖 **Multiple AI Providers** - Groq, OpenAI, Anthropic, Google Gemini
- 🚀 **Auto-staging** - Automatically stages all changes before analysis
- 🔍 **Dry Run Mode** - Preview suggestions without committing
- 📦 **Staged Only Mode** - Analyze only pre-staged changes
- 📤 **Auto-push** - Optionally push to remote after committing
- ⚡ **Simple Setup** - Just set environment variables
- 🎯 **Smart Analysis** - Analyzes your actual git diffs
- 📝 **Conventional Commits** - Follows standard format
- ✨ **Interactive** - Choose from 3 AI suggestions or write custom

## Quick Setup

### **Installation**
```bash
# Install globally with npm
npm install -g commit-suggester

# Or with Bun
bun install -g commit-suggester
```

### **Setup API Key** (choose one):
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

### **Ready to Use!**
```bash
commit-suggester           # Auto mode
commit-suggester -i        # Interactive mode
commit-suggester -d        # Dry run (preview only)
commit-suggester -s        # Staged only (skip auto-staging)
commit-suggester -p        # Push to remote after committing
```

## Get API Keys

Only one key is needed — Commit Suggester picks the first one it finds, in this order: Groq → OpenAI → Anthropic → Google.

### Groq (Recommended - Fast & Free)
1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in (GitHub/Google login supported)
3. Click **Create API Key**, give it a name, and copy the key
4. `export GROQ_API_KEY="your_key"`

Groq has a generous free tier and is the fastest option, so it's the default recommendation.

### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Log in or create an account
3. Click **Create new secret key** and copy it immediately (it's only shown once)
4. Add billing details under [platform.openai.com/account/billing](https://platform.openai.com/account/billing) — new accounts get a small free credit, after that it's pay-as-you-go
5. `export OPENAI_API_KEY="your_key"`

### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **Settings → API Keys** and click **Create Key**
4. Copy the key and add a payment method under **Settings → Billing** if you haven't already
5. `export ANTHROPIC_API_KEY="your_key"`

### Google Gemini
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (or [ai.google.dev/tutorials/setup](https://ai.google.dev/tutorials/setup) for the full guide)
2. Sign in with your Google account
3. Click **Create API key** and choose a Google Cloud project (or let it create one for you)
4. Copy the key — Gemini has a free tier with rate limits, no billing required to start
5. `export GOOGLE_GENERATIVE_AI_API_KEY="your_key"` (or `GEMINI_API_KEY`)

### Make it permanent
Add the export line to your shell profile so you don't have to set it every session:
```bash
echo 'export GROQ_API_KEY="your_key"' >> ~/.zshrc   # or ~/.bashrc
source ~/.zshrc
```

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

### **Dry Run Mode**
Preview AI suggestions without actually committing:
```bash
commit-suggester -d
# or
commit-suggester --dry-run
```

**Output:**
```
🚀 Commit Suggester - AI-powered Git Commits

🔍 Dry run mode - no commit will be made

📦 Staging all changes...
📊 Analyzing changes...
✅ Found 1 file(s): +1/-0

🤖 Using GROQ AI (llama-3.3-70b-versatile)
🎯 Auto-selected: "feat: add hello world console log"

🔍 Dry run - would commit: "feat: add hello world console log"
Run without --dry-run to actually commit.
```

### **Staged Only Mode**
Only analyze files you've already staged (respects your manual staging):
```bash
# Stage specific files manually
git add src/feature.ts

# Analyze only staged files
commit-suggester -s
# or
commit-suggester --staged
```

### **Push After Committing**
Automatically push to the remote branch after a successful commit:
```bash
commit-suggester -p
# or
commit-suggester --push
```

Combine with interactive mode:
```bash
commit-suggester -i -p     # Choose message, then push
```

### **Combining Options**
Options can be combined for more control:
```bash
commit-suggester -i -d     # Interactive + dry run
commit-suggester -i -s     # Interactive + staged only
commit-suggester -i -p     # Interactive + push after commit
commit-suggester -s -d     # Staged only + dry run
```

### **Help**
```bash
commit-suggester --help
```

**Output:**
```
🚀 Commit Suggester - AI-powered Git Commits

Usage:
  commit-suggester              # Auto-select best commit message
  commit-suggester -i           # Interactive mode (3 options + custom)
  commit-suggester -d, --dry-run    # Preview suggestions without committing
  commit-suggester -s, --staged     # Only use already staged changes
  commit-suggester -p, --push       # Push to remote after committing
  commit-suggester --help        # Show this help

Options can be combined:
  commit-suggester -i -d         # Interactive + dry run
  commit-suggester -i -s         # Interactive + staged only
  commit-suggester -i -p         # Interactive + push after commit

Setup:
  export GROQ_API_KEY="your_key"      # Recommended - Fast & Free
  export OPENAI_API_KEY="your_key"    # Alternative
  export ANTHROPIC_API_KEY="your_key" # Alternative
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

### **Dry Run Mode (-d):**
1. **Stages** changes (unless `-s` flag used)
2. **Analyzes** git diffs
3. **Generates** AI suggestions
4. **Displays** what would be committed (no actual commit)

### **Staged Only Mode (-s):**
1. **Skips** auto-staging (uses your manually staged files)
2. **Analyzes** only staged changes
3. **Generates** AI suggestions
4. **Commits** (unless `-d` flag used)

## CLI Options Reference

| Flag | Short | Description |
|------|-------|-------------|
| `--interactive` | `-i` | Choose from 3 suggestions + custom input |
| `--dry-run` | `-d` | Preview suggestions without committing |
| `--staged` | `-s` | Only analyze already-staged changes |
| `--push` | `-p` | Push to remote after committing |
| `--help` | `-h` | Show help information |

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
# Clone and setup
git clone https://github.com/rishinpoolat/commit-suggester.git
cd commit-suggester
bun install

# Run in development
bun run dev

# Build
bun run build

# Type check
bun run typecheck

# Test locally
bun link
commit-suggester
```

## License

MIT - See [LICENSE](LICENSE) file for details.

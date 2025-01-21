# AI Commit Suggester

AI-powered git commit message suggester that helps you write better commit messages.

## Installation

```bash
npm install -g ai-commit-suggester
```

## Usage

Simply run in your git repository:

```bash
commit
```

Or use it programmatically:

```javascript
const { suggestCommitMessage } = require('ai-commit-suggester');

async function example() {
  const suggestion = await suggestCommitMessage();
  console.log(suggestion);
}
```

## Configuration

Create a `.env` file with your API key:

```env
GEMINI_API_KEY=your_api_key_here
```

## License

MIT
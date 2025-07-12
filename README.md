# OnlyRules

A CLI tool to easily sync all of your favorite AI assistant instruction files from a single source. Inspired by [rulesync](https://github.com/jpcaparas/rulesync).

## Features

- Generate rule files for multiple AI assistants from a single source
- Support for both URL and local file sources
- Built-in templates to help you get started
- Multi-step rule generation process
- Written in TypeScript with Bun for optimal performance

## Supported AI Assistants

- Claude → `CLAUDE.md`
- Cursor → `.cursorrules`
- GitHub Copilot → `.github/copilot-instructions.md`
- Gemini → `GEMINI.md`
- OpenAI Codex → `AGENTS.md`
- Cline → `.clinerules/project.md`
- Junie → `.junie/guidelines.md`
- Windsurf → `.windsurfrules`

## Installation

### Prerequisites

- [Bun](https://bun.sh) 1.0.0 or higher
- Node.js 18.0.0 or higher

### Global Installation

```bash
bun install -g onlyrules
```

### Local Installation

```bash
bun install onlyrules
```

## Usage

### Generate Rule Files

From a URL:

```bash
onlyrules generate -u https://example.com/rules.md
```

From a local file:

```bash
onlyrules generate -f ./rules.md
```

Specify an output directory:

```bash
onlyrules generate -f ./rules.md -o ./output
```

Force overwrite existing files:

```bash
onlyrules generate -f ./rules.md --force
```

### Working with Templates

List available templates:

```bash
onlyrules templates
```

View a specific template:

```bash
onlyrules template basic
```

Create a new rules file from a template:

```bash
onlyrules init development -o ./my-rules.md
```

## Templates

OnlyRules comes with several built-in templates to help you get started:

- `basic`: Simple rules for general AI assistant behavior
- `development`: Rules focused on software development practices
- `multi-step`: A structured approach to creating comprehensive rules

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/onlyrules.git
cd onlyrules

# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun run test
```

### Testing

This project uses Vitest for testing and follows Test-Driven Development (TDD) principles:

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Linting and Formatting

This project uses Biome for linting and formatting:

```bash
# Format code
bun run format

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix
```

## License

MIT


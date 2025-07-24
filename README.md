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
- Trae → `.trae/rules.md`
- Lingma → `.lingma/rules`
- Kiro → `.kiro/steering`
- Tencent Cloud CodeBuddy → `.codebuddy/rules/{name}.md`

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

## Getting Started

The quickest way to get started with OnlyRules is to initialize a new project:

```bash
npx rulesync init
```

This will create a basic configuration and template files in your current directory. After initialization, you can:

1. Edit the generated rule template files in the `.augment/rules` directory
2. Generate AI assistant-specific rule files using the `generate` command
3. Customize your setup using the available templates

For more advanced usage, see the sections below.

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

### Working with Lingma Project-Specific Rules

Lingma project rules are stored in the `.lingma/rules` directory and only apply to the current project. These rules help the model better understand your project's specific coding preferences and structure.

Initialize a new Lingma project rules directory:

```bash
onlyrules lingma init
```

Create a named rule file:

```bash
onlyrules lingma init -n coding-style
```

Generate AI assistant rule files from Lingma project rules:

```bash
onlyrules lingma generate
```

Specify an output directory:

```bash
onlyrules lingma generate -o ./output
```

Force overwrite existing files:

```bash
onlyrules lingma generate --force
```

## Templates

OnlyRules comes with several built-in templates to help you get started:

- `basic`: Simple rules for general AI assistant behavior
- `development`: Rules focused on software development practices
- `multi-step`: A structured approach to creating comprehensive rules

## Kiro AI Support

OnlyRules now supports [Kiro AI](https://kiro.dev)'s steering file system. Kiro uses markdown files in `.kiro/steering/` to provide persistent project knowledge.

### Kiro Steering Features

- **Automatic Inclusion Modes**: Files can be configured to load always, conditionally based on file patterns, or manually
- **Default Steering Files**: Automatically maps common rules to Kiro's default files (product.md, tech.md, structure.md)
- **Smart File Pattern Detection**: Automatically configures file patterns for component, API, and test-specific rules

### Kiro Example

Use the Kiro example template to get started:

```bash
onlyrules init kiro-example
```

This creates a comprehensive set of steering files demonstrating:
- Always-included core project documentation
- File-pattern-based rules for components and APIs
- Manual inclusion for specialized guidelines

### Kiro Inclusion Modes

When generating rules for Kiro, OnlyRules automatically configures appropriate inclusion modes:

1. **Always** (default for root rules): Loaded in every Kiro interaction
2. **FileMatch**: Automatically included when working with matching files
3. **Manual**: Available on-demand by referencing with #steering-file-name

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


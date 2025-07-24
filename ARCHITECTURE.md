# OnlyRules Plugin-Based Architecture

This document describes the new extensible plugin-based architecture for OnlyRules, which provides a unified and organized approach to supporting multiple AI IDE rule formats.

## Overview

The new architecture implements a plugin-based system where each AI IDE has its own dedicated formatter class that implements a common interface. This design makes it easy to add new AI assistants without modifying core logic.

## Architecture Components

### 1. Core Interfaces (`src/core/interfaces.ts`)

#### `RuleFormatSpec`
Defines the specification for each rule format:
```typescript
interface RuleFormatSpec {
  id: string;                    // Unique identifier (e.g., 'cursor', 'copilot')
  name: string;                  // Human-readable name
  category: RuleFormatCategory;  // Format category
  extension: string;             // File extension
  supportsMultipleRules: boolean;
  requiresMetadata: boolean;
  defaultPath: string;           // Default output path
}
```

#### `RuleFormatCategory`
Categories organize formats by their structure:
- **DIRECTORY_BASED**: Formats using directories (`.cursor/rules`, `.clinerules`)
- **ROOT_FILE**: Single root files (`CLAUDE.md`, `GEMINI.md`)
- **MEMORY_BASED**: Memory/project-specific files (`.claude/memories`)

#### `BaseRuleFormatter`
Abstract base class that all formatters extend:
```typescript
abstract class BaseRuleFormatter {
  abstract readonly spec: RuleFormatSpec;
  abstract generateRule(rule: ParsedRule, context: RuleGenerationContext): Promise<RuleGenerationResult>;
  abstract isRuleCompatible(rule: ParsedRule): boolean;
  abstract getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string;
  protected abstract transformContent(rule: ParsedRule): string;
}
```

### 2. Rule Parser (`src/core/parser.ts`)

The `DefaultRuleParser` handles parsing `.mdc` files and extracting rules with metadata:
- Supports both single rules (`.md`) and multi-rule files (`.mdc`)
- Extracts YAML frontmatter as metadata
- Determines if rules are root/global rules

### 3. Formatter Factory (`src/core/factory.ts`)

The `DefaultRuleFormatterFactory` manages all available formatters:
- Auto-registers all built-in formatters
- Provides methods to get formatters by ID or category
- Supports runtime registration of custom formatters

### 4. Generation Pipeline (`src/core/pipeline.ts`)

The `DefaultRuleGenerationPipeline` orchestrates the complete generation process:
- Parses input from files, URLs, or direct content
- Handles IDE-style rule organization
- Executes formatters for compatible rules
- Provides comprehensive error handling and logging

## Format Categories

### Directory-Based Formats
These formats create directories with individual rule files:
- **Cursor**: `.cursor/rules/{name}.mdc` with YAML frontmatter
- **GitHub Copilot**: `.github/instructions/{name}.instructions.md` with frontmatter
- **Cline**: `.clinerules/{name}.md` with plain markdown
- **Roo**: `.roo/rules/{name}.md` with description headers

### Root File Formats
These formats create single files in the project root:
- **Claude**: `CLAUDE.md` for global rules
- **Gemini**: `GEMINI.md` for global rules

### Memory-Based Formats
These formats create memory/project-specific files:
- **Claude Memories**: `.claude/memories/{name}.md`
- **Gemini Memories**: `.gemini/memories/{name}.md`

## Adding New AI Assistants

To add support for a new AI assistant, create a new formatter class:

### Step 1: Create the Formatter

```typescript
// src/formatters/my-new-ai.ts
import { join } from 'node:path';
import {
  BaseRuleFormatter,
  RuleFormatSpec,
  RuleFormatCategory,
  ParsedRule,
  RuleGenerationContext,
  RuleGenerationResult
} from '../core/interfaces';

export class MyNewAIFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'my-new-ai',
    name: 'My New AI Assistant',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.mynewai/rules'
  };

  async generateRule(
    rule: ParsedRule,
    context: RuleGenerationContext
  ): Promise<RuleGenerationResult> {
    try {
      const filePath = this.getOutputPath(rule, context);
      await this.checkFileExists(filePath, context.force);
      await this.ensureDirectory(filePath);
      const content = this.transformContent(rule);
      await this.writeFile(filePath, content);
      
      return {
        format: this.spec.id,
        success: true,
        filePath,
        ruleName: rule.name
      };
    } catch (error) {
      return {
        format: this.spec.id,
        success: false,
        error: (error as Error).message,
        ruleName: rule.name
      };
    }
  }

  isRuleCompatible(rule: ParsedRule): boolean {
    // Define compatibility logic
    return true;
  }

  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = `${rule.name || 'default'}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  protected transformContent(rule: ParsedRule): string {
    // Transform content for your AI's specific format
    // Remove frontmatter, add headers, etc.
    return rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  }
}
```

### Step 2: Register the Formatter

Add the import and registration in `src/core/factory.ts`:

```typescript
// Add import
import { MyNewAIFormatter } from '../formatters/my-new-ai';

// Add registration in registerBuiltInFormatters()
this.registerFormatter(new MyNewAIFormatter());
```

### Step 3: Update Legacy Mapping (Optional)

If you need backward compatibility, add mapping in `src/core/generator-v2.ts`:

```typescript
const formatMapping: Record<string, string> = {
  // ... existing mappings
  '.mynewai/rules': 'my-new-ai'
};
```

## Usage Examples

### Basic Usage (Backward Compatible)
```typescript
import { generateRules } from 'onlyrules';

await generateRules({
  file: './my-rules.mdc',
  output: './output',
  force: true,
  verbose: true
});
```

### Using New Pipeline Directly
```typescript
import { DefaultRuleGenerationPipeline } from 'onlyrules';

const pipeline = new DefaultRuleGenerationPipeline();

const results = await pipeline.execute({
  input: './my-rules.mdc',
  outputDir: './output',
  formats: ['cursor', 'copilot', 'claude-root'],
  force: true,
  verbose: true
});
```

### Custom Formatter Registration
```typescript
import { DefaultRuleGenerationPipeline } from 'onlyrules';
import { MyCustomFormatter } from './my-custom-formatter';

const pipeline = new DefaultRuleGenerationPipeline();
pipeline.registerFormatter(new MyCustomFormatter());

const results = await pipeline.execute({
  input: './my-rules.mdc',
  outputDir: './output',
  formats: ['my-custom-format'],
  force: true
});
```

### Getting Available Formats
```typescript
import { getAvailableFormats, getFormatsByCategory } from 'onlyrules';

// Get all format IDs
const allFormats = getAvailableFormats();
console.log(allFormats); // ['cursor', 'copilot', 'cline', ...]

// Get formats by category
const byCategory = getFormatsByCategory();
console.log(byCategory);
// {
//   directory: ['cursor', 'copilot', 'cline', 'roo'],
//   root: ['claude-root', 'gemini-root'],
//   memory: ['claude-memories', 'gemini-memories']
// }
```

## Migration Guide

### From Legacy System

The new system is **backward compatible**. Existing code will continue to work without changes. The system automatically uses the new architecture unless `ONLYRULES_USE_LEGACY=true` is set.

### For Custom Extensions

If you have custom extensions to the old system:

1. **Custom Writers**: Convert to formatter classes implementing `BaseRuleFormatter`
2. **Custom Parsers**: Extend `DefaultRuleParser` or implement `RuleParser` interface
3. **Custom Logic**: Use the pipeline system for better separation of concerns

## Benefits

1. **Extensible**: Add new AI assistants without touching core logic
2. **Organized**: Clear separation by categories and responsibilities
3. **Type Safe**: Full TypeScript interfaces and type checking
4. **Consistent**: Standardized patterns for all formatters
5. **Testable**: Each formatter can be tested independently
6. **Maintainable**: Clear structure makes maintenance easier

## Supported Formatters

The system includes formatters for various AI assistants:

### Directory-Based Formatters
- **cursor**: Cursor IDE (`.cursor/rules/{name}.mdc`)
- **copilot**: GitHub Copilot (`.github/copilot-instructions.md`)
- **cline**: Cline (`.clinerules/project.md`)
- **roo**: Roo (`.roo/rules/{name}.md`)
- **kiro**: Kiro (`.kiro/steering`)
- **codebuddy**: Tencent Cloud CodeBuddy (`.codebuddy/rules/{name}.md`)

### Root File Formatters
- **claude-root**: Claude (`CLAUDE.md`)
- **gemini-root**: Gemini (`GEMINI.md`)

### Memory-Based Formatters
- **claude-memories**: Claude Memories (`claude_memories/{category}/{name}.md`)
- **gemini-memories**: Gemini Memories (`gemini_memories/{category}/{name}.md`)

### Legacy Formatters
- **agents**: OpenAI Codex (`AGENTS.md`)
- **junie**: Junie (`.junie/guidelines.md`)
- **windsurf**: Windsurf (`.windsurfrules`)
- **trae**: Trae (`.trae/rules.md`)
- **augment**: Augment (`.augment/rules/manual/{name}.md`)
- **augment-always**: Augment Always (`.augment/rules/always/{name}.md`)
- **lingma-project**: Lingma (`.lingma/rules`)

## Testing

Each formatter should be tested independently:

```typescript
import { MyNewAIFormatter } from '../src/formatters/my-new-ai';

test('MyNewAI formatter generates correct files', async () => {
  const formatter = new MyNewAIFormatter();
  const rule = { name: 'test', content: '# Test Rule', isRoot: false };
  const context = { outputDir: './test-output', force: true, verbose: false };
  
  const result = await formatter.generateRule(rule, context);
  
  expect(result.success).toBe(true);
  expect(result.format).toBe('my-new-ai');
  // Add more assertions...
});
```

## Environment Variables

- `ONLYRULES_USE_LEGACY=true`: Force use of legacy implementation
- Set to test fallback behavior or when debugging

## Future Considerations

- **Plugin Discovery**: Automatic discovery of third-party formatter plugins
- **Configuration**: Per-format configuration options
- **Validation**: Schema validation for different AI rule formats
- **Templates**: Format-specific rule templates
- **Async Loading**: Lazy loading of formatters for better startup performance
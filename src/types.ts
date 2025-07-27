/**
 * Supported AI assistant rule formats
 */
export enum RuleFormat {
  // GitHub Copilot - Front Matter + Markdown format
  COPILOT = '.github/instructions',
  
  // Cursor - MDC format (YAML header + Markdown)
  // Different rule types: always, specificFiles, intelligently, manual (default)
  CURSOR = '.cursor/rules',
  
  // Cline - Plain Markdown format
  CLINE = '.clinerules',
  
  // Claude Code - Plain Markdown format
  // Root level goes to CLAUDE.md, non-root to separate memory files
  CLAUDE_ROOT = 'CLAUDE.md',
  CLAUDE_MEMORIES = '.claude/memories',
  
  // Roo Code - Plain Markdown with description header
  ROO = '.roo/rules',
  
  // Kiro AI - Markdown with YAML frontmatter for inclusion modes
  KIRO = '.kiro/steering',
  
  // Gemini CLI - Plain Markdown format
  // Root level goes to GEMINI.md, non-root to separate memory files
  GEMINI_ROOT = 'GEMINI.md',
  GEMINI_MEMORIES = '.gemini/memories',
  
  // Legacy formats (keeping for backward compatibility)
  AGENTS = 'AGENTS.md',
  JUNIE = '.junie/guidelines.md',
  WINDSURF = '.windsurfrules',
  TRAE = '.trae/rules.md',
  AUGMENT = '.augment-guidelines',
  AUGMENT_ALWAYS = '.augment/rules/always.md',
  LINGMA_PROJECT = '.lingma/rules'
}

/**
 * CLI command types
 */
export type CliCommand = 'generate' | 'templates' | 'template' | 'init' | 'gitignore' | 'prunge';

/**
 * Base CLI arguments interface
 */
export interface BaseCliArgs {
  command: CliCommand;
}

/**
 * Generate command arguments
 */
export interface GenerateCliArgs extends BaseCliArgs {
  command: 'generate';
  file?: string; // Can be either a local file path or URL
  output: string;
  verbose?: boolean;
  force?: boolean;
  target?: string; // Comma-separated list of target formats to generate (e.g., "cursor,windsurf,kiro")
}

/**
 * Template command arguments
 */
export interface TemplateCliArgs extends BaseCliArgs {
  command: 'template';
  templateName: string;
}

/**
 * Templates list command arguments
 */
export interface TemplatesCliArgs extends BaseCliArgs {
  command: 'templates';
}

/**
 * Init command arguments
 */
export interface InitCliArgs extends BaseCliArgs {
  command: 'init';
  templateName: string;
  output: string;
  force?: boolean;
}


/**
 * Gitignore command arguments
 */
export interface GitignoreCliArgs extends BaseCliArgs {
  command: 'gitignore';
}

/**
 * Prunge command arguments
 */
export interface PrungeCliArgs extends BaseCliArgs {
  command: 'prunge';
}

/**
 * Combined CLI arguments type
 */
export type CliArgs = GenerateCliArgs | TemplateCliArgs | TemplatesCliArgs | InitCliArgs | GitignoreCliArgs | PrungeCliArgs;

/**
 * Rule generation options
 */
export interface RuleGenerationOptions {
  file?: string; // Can be either a local file path or URL
  output: string;
  formats?: RuleFormat[];
  verbose?: boolean;
  force?: boolean;
  rulesContent?: string; // Direct rules content to use instead of reading from file or URL
  ideStyle?: boolean; // Whether to use IDE-style rule organization (default: true)
  ideFolder?: string; // Custom folder name for IDE-style rules (default: '.rules')
  generateTraditional?: boolean; // Whether to also generate traditional format files
  target?: string[]; // Array of target format names to generate (e.g., ["cursor", "windsurf", "kiro"])
}

/**
 * Rule template interface
 */
export interface RuleTemplate {
  name: string;
  description: string;
  content: string;
}

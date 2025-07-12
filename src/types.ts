/**
 * Supported AI assistant rule formats
 */
export enum RuleFormat {
  CURSOR = '.cursorrules',
  CLAUDE = 'CLAUDE.md',
  COPILOT = '.github/copilot-instructions.md',
  GEMINI = 'GEMINI.md',
  AGENTS = 'AGENTS.md',
  CLINE = '.clinerules/project.md',
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
export type CliCommand = 'generate' | 'templates' | 'template' | 'init' | 'lingma';

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
  url?: string;
  file?: string;
  output: string;
  verbose?: boolean;
  force?: boolean;
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
 * Lingma command arguments
 */
export interface LingmaCliArgs extends BaseCliArgs {
  command: 'lingma';
  action: 'init' | 'generate';
  ruleName?: string;
  output?: string;
  force?: boolean;
}

/**
 * Combined CLI arguments type
 */
export type CliArgs = GenerateCliArgs | TemplateCliArgs | TemplatesCliArgs | InitCliArgs | LingmaCliArgs;

/**
 * Rule generation options
 */
export interface RuleGenerationOptions {
  url?: string;
  file?: string;
  output: string;
  formats?: RuleFormat[];
  verbose?: boolean;
  force?: boolean;
  rulesContent?: string; // Direct rules content to use instead of reading from file or URL
}

/**
 * Rule template interface
 */
export interface RuleTemplate {
  name: string;
  description: string;
  content: string;
}

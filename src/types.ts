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
  WINDSURF = '.windsurfrules'
}

/**
 * CLI command types
 */
export type CliCommand = 'generate' | 'templates' | 'template' | 'init';

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
}

/**
 * Combined CLI arguments type
 */
export type CliArgs = GenerateCliArgs | TemplateCliArgs | TemplatesCliArgs | InitCliArgs;

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
}

/**
 * Rule template interface
 */
export interface RuleTemplate {
  name: string;
  description: string;
  content: string;
}

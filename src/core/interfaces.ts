/**
 * Unified rule format interface for all AI assistants
 */
export interface RuleFormatSpec {
  /** Unique identifier for the format */
  id: string;
  /** Human-readable name */
  name: string;
  /** Format category */
  category: RuleFormatCategory;
  /** File extension to use */
  extension: string;
  /** Whether this format supports multiple rules in a single file */
  supportsMultipleRules: boolean;
  /** Whether this format requires metadata/frontmatter */
  requiresMetadata: boolean;
  /** Default output path for this format */
  defaultPath: string;
}

/**
 * Categories of rule formats
 */
export enum RuleFormatCategory {
  /** Formats that use directories with individual rule files */
  DIRECTORY_BASED = 'directory',
  /** Formats that use a single root file */
  ROOT_FILE = 'root',
  /** Formats that use memory/project-specific files */
  MEMORY_BASED = 'memory'
}

/**
 * Parsed rule data structure
 */
export interface ParsedRule {
  /** Rule name/identifier */
  name: string;
  /** Rule content */
  content: string;
  /** Optional metadata */
  metadata?: Record<string, any>;
  /** Whether this is a root/global rule */
  isRoot: boolean;
}

/**
 * Rule generation context
 */
export interface RuleGenerationContext {
  /** Output directory */
  outputDir: string;
  /** Whether to force overwrite existing files */
  force: boolean;
  /** Whether to output verbose logging */
  verbose: boolean;
  /** Optional rule name for specific targeting */
  ruleName?: string;
}

/**
 * Rule generation result
 */
export interface RuleGenerationResult {
  /** Format that was generated */
  format: string;
  /** Whether generation was successful */
  success: boolean;
  /** File path that was written */
  filePath?: string;
  /** Error message if generation failed */
  error?: string;
  /** Rule name that was processed */
  ruleName?: string;
}

/**
 * Abstract base class for rule formatters
 */
export abstract class BaseRuleFormatter {
  abstract readonly spec: RuleFormatSpec;

  /**
   * Generate rule file(s) for this format
   */
  abstract generateRule(
    rule: ParsedRule,
    context: RuleGenerationContext
  ): Promise<RuleGenerationResult>;

  /**
   * Validate if a rule is compatible with this format
   */
  abstract isRuleCompatible(rule: ParsedRule): boolean;

  /**
   * Get the output file path for a rule
   */
  abstract getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string;

  /**
   * Transform rule content for this format
   */
  protected abstract transformContent(rule: ParsedRule): string;

  /**
   * Create directory structure if needed
   */
  protected async ensureDirectory(filePath: string): Promise<void> {
    const { mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(filePath), { recursive: true });
  }

  /**
   * Check if file exists and handle force overwrite logic
   */
  protected async checkFileExists(filePath: string, force: boolean): Promise<void> {
    const { existsSync } = await import('node:fs');
    if (existsSync(filePath) && !force) {
      throw new Error(`File ${filePath} already exists. Use --force to overwrite.`);
    }
  }

  /**
   * Write content to file
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(filePath, content);
  }
}

/**
 * Factory interface for creating rule formatters
 */
export interface RuleFormatterFactory {
  /**
   * Get all available formatters
   */
  getAvailableFormatters(): Map<string, BaseRuleFormatter>;

  /**
   * Get a specific formatter by ID
   */
  getFormatter(formatId: string): BaseRuleFormatter | undefined;

  /**
   * Register a new formatter
   */
  registerFormatter(formatter: BaseRuleFormatter): void;

  /**
   * Get formatters by category
   */
  getFormattersByCategory(category: RuleFormatCategory): BaseRuleFormatter[];
}

/**
 * Rule parser interface
 */
export interface RuleParser {
  /**
   * Parse rules from content
   */
  parseRules(content: string, filePath?: string): ParsedRule[];

  /**
   * Validate rule content
   */
  validateRules(rules: ParsedRule[]): boolean;

  /**
   * Extract metadata from rule content
   */
  extractMetadata(content: string): Record<string, any>;
}

/**
 * Pipeline options for rule generation
 */
export interface RuleGenerationPipelineOptions {
  /** Input content or file path */
  input: string | { content: string; filePath?: string };
  /** Output directory */
  outputDir: string;
  /** Formats to generate (if empty, generates all) */
  formats?: string[];
  /** Whether to force overwrite */
  force?: boolean;
  /** Whether to enable verbose logging */
  verbose?: boolean;
  /** Whether to use IDE-style organization */
  ideStyle?: boolean;
  /** Custom IDE folder name */
  ideFolder?: string;
}

/**
 * Main rule generation pipeline interface
 */
export interface RuleGenerationPipeline {
  /**
   * Execute the complete rule generation pipeline
   */
  execute(options: RuleGenerationPipelineOptions): Promise<RuleGenerationResult[]>;

  /**
   * Get available format specifications
   */
  getAvailableFormats(): RuleFormatSpec[];

  /**
   * Register custom formatter
   */
  registerFormatter(formatter: BaseRuleFormatter): void;
}
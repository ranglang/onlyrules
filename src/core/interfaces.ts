import { ONLEYRULES_ALL_TARGETS_TYPE } from '../consts';

/**
 * Categories of rule formats
 */
export enum RuleFormatCategory {
  /** Formats that use directories with individual rule files */
  DIRECTORY_BASED = 'directory',
  /** Formats that use a single root file */
  ROOT_FILE = 'root',
  /** Formats that use memory/project-specific files */
  MEMORY_BASED = 'memory',
}

/**
 * Apply type for rules across different IDEs
 */
export type ApplyType = 'auto' | 'manual' | 'always';

/**
 * Parsed rule data structure
 */
export interface ParsedRule {
  /** Rule name/identifier */
  name: string;
  /** Rule content */
  content: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Whether this is a root/global rule */
  isRoot: boolean;
  /** Apply type for the rule */
  applyType?: ApplyType;
  /** Description for the rule, important for IDE rule application */
  description?: string;
  /** Glob patterns for file matching, important for IDE rule application */
  glob?: string | string[];
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
 * Pipeline step for building frontmatter metadata
 */
export interface FrontmatterPipelineStep {
  /**
   * Process a rule and add/modify frontmatter metadata
   */
  process(rule: ParsedRule, metadata: Record<string, unknown>): Record<string, unknown>;
}

/**
 * Builder for constructing frontmatter pipelines
 */
export class FrontmatterPipelineBuilder {
  private steps: FrontmatterPipelineStep[] = [];

  /**
   * Add a pipeline step
   */
  addStep(step: FrontmatterPipelineStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Execute the pipeline on a rule
   */
  execute(rule: ParsedRule): Record<string, unknown> {
    let metadata: Record<string, unknown> = {};

    for (const step of this.steps) {
      metadata = step.process(rule, metadata);
    }

    return metadata;
  }

  /**
   * Get the pipeline steps
   */
  getSteps(): FrontmatterPipelineStep[] {
    return [...this.steps];
  }
}

/**
 * Common frontmatter pipeline steps
 */
export namespace CommonFrontmatterSteps {
  /**
   * Add type field to frontmatter
   */
  export function addType(type: string): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        metadata.type = type;
        return metadata;
      },
    };
  }

  /**
   * Add description from rule if available
   */
  export function addDescription(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        if (rule.description) {
          metadata.description = rule.description;
        }
        return metadata;
      },
    };
  }

  /**
   * Add glob pattern from rule if available
   */
  export function addGlob(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        if (rule.glob) {
          metadata.glob = rule.glob;
        }
        return metadata;
      },
    };
  }

  /**
   * Add apply type from rule
   */
  export function addApplyType(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        metadata.type = rule.applyType || 'manual';
        return metadata;
      },
    };
  }
}

/**
 * Abstract base class for rule formatters
 */
export abstract class BaseRuleFormatter {
  protected frontmatterPipeline: FrontmatterPipelineBuilder;

  constructor(public spec: RuleFormatSpec) {
    this.frontmatterPipeline = new FrontmatterPipelineBuilder();
    this.configureFrontmatterPipeline();
  }

  /**
   * Configure the frontmatter pipeline - to be implemented by subclasses
   */
  protected abstract configureFrontmatterPipeline(): void;

  /**
   * Generate a rule file
   */
  async generateRule(
    rule: ParsedRule,
    context: RuleGenerationContext
  ): Promise<RuleGenerationResult> {
    try {
      // Validate rule content
      this.validateRule(rule);

      // Transform content
      const transformedContent = this.transformContent(rule);

      // Generate file path
      const filePath = this.generateFilePath(rule, context);

      // Ensure directory exists
      await this.ensureDirectory(filePath);

      // Write file
      const { writeFile } = await import('node:fs/promises');
      await writeFile(filePath, transformedContent, 'utf-8');

      return {
        success: true,
        filePath,
        format: this.spec.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        format: this.spec.id,
      };
    }
  }

  /**
   * Validate rule content
   */
  protected validateRule(rule: ParsedRule): void {
    if (!rule.content || rule.content.trim().length === 0) {
      throw new Error('Rule content cannot be empty');
    }
  }

  /**
   * Generate file path for a rule
   */
  protected generateFilePath(rule: ParsedRule, context: RuleGenerationContext): string {
    return this.getOutputPath(rule, context);
  }

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
   * Get the apply type for this rule from rule metadata
   */
  protected determineApplyType(rule: ParsedRule): ApplyType {
    // Use applyType from rule if provided, otherwise default to manual
    return rule.applyType || 'auto';
  }

  /**
   * Generate frontmatter using the configured pipeline
   */
  protected generateFrontmatter(rule: ParsedRule): string {
    const metadata = this.frontmatterPipeline.execute(rule);
    return this.convertMetadataToFrontmatter(metadata);
  }

  /**
   * Generic function to convert metadata record to frontmatter string
   */
  protected convertMetadataToFrontmatter(metadata: Record<string, unknown>): string {
    if (Object.keys(metadata).length === 0) {
      return '';
    }

    const frontmatterLines = Object.entries(metadata).map(([key, value]) => {
      // Handle different value types
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      }
      if (typeof value === 'boolean' || typeof value === 'number') {
        return `${key}: ${value}`;
      }
      if (Array.isArray(value)) {
        return `${key}: [${value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ')}]`;
      }
      // For objects, convert to JSON
      return `${key}: ${JSON.stringify(value)}`;
    });

    return `---\n${frontmatterLines.join('\n')}\n---`;
  }

  /**
   * @deprecated Use generateFrontmatter() instead
   * Create basic frontmatter for rule metadata
   */
  protected createBasicFrontmatter(rule: ParsedRule, applyType: ApplyType): string {
    // Legacy method - use pipeline instead
    const legacyPipeline = new FrontmatterPipelineBuilder()
      .addStep(CommonFrontmatterSteps.addType(applyType))
      .addStep(CommonFrontmatterSteps.addDescription())
      .addStep(CommonFrontmatterSteps.addGlob());

    const metadata = legacyPipeline.execute(rule);
    return this.convertMetadataToFrontmatter(metadata);
  }

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

  /**
   * Append content to file (for multiple rules support)
   */
  protected async appendToFile(filePath: string, content: string): Promise<void> {
    const { existsSync } = await import('node:fs');
    const { readFile, writeFile } = await import('node:fs/promises');

    let existingContent = '';
    if (existsSync(filePath)) {
      existingContent = await readFile(filePath, 'utf-8');
    }

    // Combine existing content with new content
    const combinedContent = existingContent ? `${existingContent}\n\n${content}` : content;

    await writeFile(filePath, combinedContent);
  }

  /**
   * Sanitize rule name for file naming (convert to snake_case)
   */
  protected sanitizeFileName(name: string): string {
    return (
      name
        .trim()
        // Replace spaces, hyphens, and underscores with a single hyphen
        .replace(/[\s_]+/g, '-')
        // Convert camelCase to kebab-case
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        // Convert to lowercase
        .toLowerCase()
        // Remove any non-alphanumeric characters except hyphens
        .replace(/[^a-z0-9-]/g, '')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        // Replace multiple consecutive hyphens with single hyphen
        .replace(/-+/g, '-')
    );
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
  extractMetadata(content: string): Record<string, unknown>;
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

/**
 * Unified rule format interface for all AI assistants
 */
export interface RuleFormatSpec {
  /** Unique identifier for the format */
  id: ONLEYRULES_ALL_TARGETS_TYPE;
  /** Human-readable name */
  name: string;
  /** Format category */
  category: 'directory' | 'root' | 'memory';
  /** File extension to use */
  extension: string;
  /** Whether this format supports multiple rules in a single file */
  supportsMultipleRules: boolean;
  /** Whether this format requires metadata/frontmatter */
  requiresMetadata: boolean;
  /** Default output path for this format */
  defaultPath: string;
}

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

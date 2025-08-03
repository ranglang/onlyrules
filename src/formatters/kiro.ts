import { join } from 'node:path';
import {
  BaseRuleFormatter,
  CommonFrontmatterSteps,
  FrontmatterPipelineStep,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';
// Removed ONLEYRULES_ALL_TARGETS import to avoid module loading issues

/**
 * Kiro AI assistant rule formatter
 * Generates .kiro/steering/{name}.md files with YAML frontmatter for inclusion modes
 */
export class KiroFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: 'kiro',
    name: 'Kiro AI',
    category: 'directory',
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.kiro/steering',
  };

  // Default steering files that Kiro creates automatically
  private readonly defaultFiles = ['product.md', 'tech.md', 'structure.md'];

  constructor() {
    super(KiroFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for Kiro format
   */
  protected configureFrontmatterPipeline(): void {
    this.frontmatterPipeline.addStep(this.createInclusionStep());
  }

  /**
   * Create Kiro-specific inclusion mode step
   */
  private createInclusionStep(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        const ruleMetadata = rule.metadata || {};

        // Determine inclusion mode based on rule metadata or defaults
        if (ruleMetadata.inclusion) {
          metadata.inclusion = ruleMetadata.inclusion;
          if (ruleMetadata.inclusion === 'fileMatch' && ruleMetadata.fileMatchPattern) {
            metadata.fileMatchPattern = ruleMetadata.fileMatchPattern;
          }
        } else {
          // Apply smart defaults based on rule characteristics
          if (rule.isRoot || this.isDefaultFile(rule.name)) {
            metadata.inclusion = 'always';
          } else if (this.hasFilePatternHint(rule)) {
            metadata.inclusion = 'fileMatch';
            metadata.fileMatchPattern = this.inferFilePattern(rule);
          } else {
            metadata.inclusion = 'manual';
          }
        }

        return metadata;
      },
    };
  }

  /**
   * Generate rule file for Kiro AI
   */
  async generateRule(
    rule: ParsedRule,
    context: RuleGenerationContext
  ): Promise<RuleGenerationResult> {
    try {
      const filePath = this.getOutputPath(rule, context);

      // Check if file exists
      await this.checkFileExists(filePath, context.force);

      // Ensure directory exists
      await this.ensureDirectory(filePath);

      // Transform content with Kiro-specific formatting
      const content = this.transformContent(rule);

      // Write file
      await this.writeFile(filePath, content);

      return {
        format: this.spec.id,
        success: true,
        filePath,
        ruleName: rule.name,
      };
    } catch (error) {
      return {
        format: this.spec.id,
        success: false,
        error: (error as Error).message,
        ruleName: rule.name,
      };
    }
  }

  /**
   * Check if rule is compatible with Kiro format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Kiro supports all rules
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = this.getFileName(rule);
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Kiro format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;

    // Generate frontmatter using the pipeline
    const frontmatter = this.generateFrontmatter(rule);

    // Only add frontmatter if it contains meaningful data (not just 'always' inclusion)
    const metadata = this.frontmatterPipeline.execute(rule);
    const shouldAddFrontmatter =
      metadata.inclusion !== 'always' || Object.keys(metadata).length > 1;

    if (frontmatter && shouldAddFrontmatter) {
      content = `${frontmatter}\n${content}`;
    }

    return content;
  }

  /**
   * Get filename for the rule
   */
  private getFileName(rule: ParsedRule): string {
    // Use standardized names for common rule types
    const name = rule.name.toLowerCase();

    // Map common rule names to Kiro's default files
    if (name.includes('product') || name.includes('overview')) {
      return 'product.md';
    }
    if (name.includes('tech') || name.includes('stack') || name.includes('technology')) {
      return 'tech.md';
    }
    if (name.includes('structure') || name.includes('architecture')) {
      return 'structure.md';
    }

    // For other rules, use standardized snake_case conversion
    const filename = this.sanitizeFileName(rule.name);

    return `${filename}${this.spec.extension}`;
  }

  /**
   * Check if this is one of Kiro's default files
   */
  private isDefaultFile(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this.defaultFiles.some((defaultFile) =>
      lowerName.includes(defaultFile.replace('.md', ''))
    );
  }

  /**
   * Check if rule content suggests it's for specific file types
   */
  private hasFilePatternHint(rule: ParsedRule): boolean {
    const indicators = [
      'component',
      'api',
      'test',
      'route',
      'endpoint',
      'tsx',
      'jsx',
      'vue',
      'react',
      'angular',
      'backend',
      'frontend',
      'database',
      'migration',
    ];

    const lowerContent = `${rule.name} ${rule.content}`.toLowerCase();
    return indicators.some((indicator) => lowerContent.includes(indicator));
  }

  /**
   * Infer file pattern based on rule content and name
   */
  private inferFilePattern(rule: ParsedRule): string {
    const name = rule.name.toLowerCase();
    const content = rule.content.toLowerCase();

    // Common patterns based on rule type
    if (name.includes('component') || content.includes('component')) {
      return 'components/**/*.{tsx,jsx,vue}';
    }
    if (name.includes('api') || name.includes('endpoint')) {
      return 'app/api/**/*';
    }
    if (name.includes('test')) {
      return '**/*.{test,spec}.{ts,tsx,js,jsx}';
    }
    if (name.includes('style') || name.includes('css')) {
      return '**/*.{css,scss,sass,less}';
    }
    if (name.includes('config')) {
      return '*.config.{js,ts,json}';
    }

    // Default to all TypeScript/JavaScript files
    return '**/*.{ts,tsx,js,jsx}';
  }
}

import { join } from 'node:path';
// Removed ONLEYRULES_ALL_TARGETS import to avoid module loading issues
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';

/**
 * Cline rule formatter
 * Generates .clinerules/{name}.md files with plain markdown
 */
export class ClineFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: 'cline',
    name: 'Cline',
    category: 'directory',
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.clinerules',
  };

  constructor() {
    super(ClineFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for Cline format
   * Cline doesn't use frontmatter, so this is minimal
   */
  protected configureFrontmatterPipeline(): void {
    // Cline doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate rule file for Cline
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

      // Transform content
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
   * Check if rule is compatible with Cline format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Cline supports all rules
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const sanitizedName = this.sanitizeFileName(rule.name || 'default');
    const filename = `${sanitizedName}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Cline format
   */
  protected transformContent(rule: ParsedRule): string {
    // Cline uses plain markdown, so just return the content as-is
    // Remove any existing frontmatter since Cline doesn't use it
    let content = rule.content;

    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    return content;
  }
}

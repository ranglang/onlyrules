import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';
// Removed imports to avoid bundling issues

/**
 * Roo Code rule formatter
 * Generates .roo/rules/{name}.md files with description header
 */
export class RooFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'roo',
    name: 'Roo Code',
    category: 'directory',
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.roo/rules',
  };

  /**
   * Configure the frontmatter pipeline for Roo format
   */
  protected configureFrontmatterPipeline(): void {
    // Roo doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate rule file for Roo
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
   * Check if rule is compatible with Roo format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Roo supports all rules
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
   * Transform rule content for Roo format
   */
  protected transformContent(rule: ParsedRule): string {
    // Roo uses plain markdown with description header
    let content = rule.content;

    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    // Add description header if not present and we have a title in metadata
    if (rule.metadata?.title && !content.startsWith('#')) {
      content = `# ${rule.metadata.title}\n\n${content}`;
    }

    return content;
  }
}

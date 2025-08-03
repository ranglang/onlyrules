import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';

/**
 * Gemini memories formatter
 * Generates .gemini/memories/{name}.md files for specific rules
 */
export class GeminiMemoriesFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'gemini-memories',
    name: 'Gemini Memories',
    category: RuleFormatCategory.MEMORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.gemini/memories',
  };

  /**
   * Configure the frontmatter pipeline for Gemini memories format
   */
  protected configureFrontmatterPipeline(): void {
    // Gemini memories doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate memory file for Gemini
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
   * Check if rule is compatible with Gemini memories format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Only generate memory files for non-root rules
    return !rule.isRoot;
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
   * Transform rule content for Gemini memories format
   */
  protected transformContent(rule: ParsedRule): string {
    // Gemini uses plain markdown, remove any frontmatter
    let content = rule.content;

    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    return content;
  }
}

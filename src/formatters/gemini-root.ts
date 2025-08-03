import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';
import { ONLEYRULES_ALL_TARGETS } from '../consts';

/**
 * Gemini root file formatter
 * Generates GEMINI.md file for root/global rules
 */
export class GeminiRootFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: ONLEYRULES_ALL_TARGETS.GEMINI_ROOT,
    name: 'Gemini Root File',
    category: RuleFormatCategory.ROOT_FILE,
    extension: '.md',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: 'GEMINI.md',
  };

  /**
   * Configure the frontmatter pipeline for Gemini root format
   */
  protected configureFrontmatterPipeline(): void {
    // Gemini root doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate root file for Gemini
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
   * Check if rule is compatible with Gemini root format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Only generate root file for root rules
    return rule.isRoot;
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
   * Transform rule content for Gemini root format
   */
  protected transformContent(rule: ParsedRule): string {
    // Gemini uses plain markdown, remove any frontmatter
    let content = rule.content;

    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    return content;
  }
}

import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../../core/interfaces';
import { ONLEYRULES_ALL_TARGETS } from '../../consts';

/**
 * Legacy Junie formatter
 * Generates .junie/guidelines.md file
 */
export class JunieFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: ONLEYRULES_ALL_TARGETS.JUNIE,
    name: 'Junie (Legacy)',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: '.junie/guidelines.md',
  };

  /**
   * Configure the frontmatter pipeline for Junie format
   */
  protected configureFrontmatterPipeline(): void {
    // Junie doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate file for Junie
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
   * Check if rule is compatible with Junie format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    return join(context.outputDir, this.spec.defaultPath);
  }

  /**
   * Transform rule content for Junie format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    return content;
  }
}

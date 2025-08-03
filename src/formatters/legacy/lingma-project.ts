import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../../core/interfaces';

export class LingmaProjectFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'lingma-project',
    name: 'Lingma Project (Legacy)',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.lingma/rules',
  };

  /**
   * Configure the frontmatter pipeline for Lingma Project format
   */
  protected configureFrontmatterPipeline(): void {
    // Lingma Project doesn't use frontmatter, so no pipeline steps needed
  }

  async generateRule(
    rule: ParsedRule,
    context: RuleGenerationContext
  ): Promise<RuleGenerationResult> {
    try {
      const filePath = this.getOutputPath(rule, context);
      await this.checkFileExists(filePath, context.force);
      await this.ensureDirectory(filePath);
      const content = this.transformContent(rule);
      await this.writeFile(filePath, content);

      return { format: this.spec.id, success: true, filePath, ruleName: rule.name };
    } catch (error) {
      return {
        format: this.spec.id,
        success: false,
        error: (error as Error).message,
        ruleName: rule.name,
      };
    }
  }

  isRuleCompatible(rule: ParsedRule): boolean {
    return true;
  }

  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = `${rule.name || 'default'}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  protected transformContent(rule: ParsedRule): string {
    return rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  }
}

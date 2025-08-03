import { join } from 'node:path';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../../core/interfaces';

export class TraeFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'trae',
    name: 'Trae (Legacy)',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: '.trae/rules.md',
  };

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
    return join(context.outputDir, this.spec.defaultPath);
  }

  protected transformContent(rule: ParsedRule): string {
    return rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  }
}

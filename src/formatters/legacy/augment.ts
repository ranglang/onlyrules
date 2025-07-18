import { join } from 'node:path';
import {
  BaseRuleFormatter,
  RuleFormatSpec,
  RuleFormatCategory,
  ParsedRule,
  RuleGenerationContext,
  RuleGenerationResult
} from '../../core/interfaces';

export class AugmentFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'augment',
    name: 'Augment (Legacy)',
    category: RuleFormatCategory.ROOT_FILE,
    extension: '',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: '.augment-guidelines'
  };

  async generateRule(rule: ParsedRule, context: RuleGenerationContext): Promise<RuleGenerationResult> {
    try {
      const filePath = this.getOutputPath(rule, context);
      await this.checkFileExists(filePath, context.force);
      await this.ensureDirectory(filePath);
      const content = this.transformContent(rule);
      await this.writeFile(filePath, content);
      
      return { format: this.spec.id, success: true, filePath, ruleName: rule.name };
    } catch (error) {
      return { format: this.spec.id, success: false, error: (error as Error).message, ruleName: rule.name };
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
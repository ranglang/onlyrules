import { join } from 'node:path';
import {
  BaseRuleFormatter,
  RuleFormatSpec,
  RuleFormatCategory,
  ParsedRule,
  RuleGenerationContext,
  RuleGenerationResult
} from '../core/interfaces';

/**
 * Cursor IDE rule formatter
 * Generates .cursor/rules/{name}.mdc files with YAML frontmatter
 */
export class CursorFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'cursor',
    name: 'Cursor IDE',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.mdc',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.cursor/rules'
  };

  /**
   * Generate rule file for Cursor IDE
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
        ruleName: rule.name
      };
    } catch (error) {
      return {
        format: this.spec.id,
        success: false,
        error: (error as Error).message,
        ruleName: rule.name
      };
    }
  }

  /**
   * Check if rule is compatible with Cursor format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Cursor supports all rules
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = `${rule.name || 'default'}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Cursor format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;

    // Add YAML frontmatter if not already present
    if (!content.includes('cursorRuleType:')) {
      const ruleType = rule.isRoot ? 'always' : 'manual';
      const frontmatter = this.createFrontmatter(rule, ruleType);
      content = `${frontmatter}\n\n${content}`;
    }

    return content;
  }

  /**
   * Create YAML frontmatter for Cursor
   */
  private createFrontmatter(rule: ParsedRule, ruleType: string): string {
    const metadata = {
      cursorRuleType: ruleType,
      ...rule.metadata
    };

    const frontmatterLines = Object.entries(metadata)
      .map(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return `${key}: ${stringValue}`;
      });

    return `---\n${frontmatterLines.join('\n')}\n---`;
  }
}
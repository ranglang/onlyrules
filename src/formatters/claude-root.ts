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
 * Claude root file formatter
 * Generates CLAUDE.md file for root/global rules
 */
export class ClaudeRootFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'claude-root',
    name: 'Claude Root File',
    category: RuleFormatCategory.ROOT_FILE,
    extension: '.md',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: 'CLAUDE.md'
  };

  /**
   * Generate root file for Claude
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
   * Check if rule is compatible with Claude root format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Only generate root file for root rules
    return rule.isRoot;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    return join(context.outputDir, this.spec.defaultPath);
  }

  /**
   * Transform rule content for Claude root format
   */
  protected transformContent(rule: ParsedRule): string {
    // Claude uses plain markdown, remove any frontmatter
    let content = rule.content;
    
    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    
    return content;
  }
}
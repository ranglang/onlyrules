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
 * Claude memories formatter
 * Generates .claude/memories/{name}.md files for specific rules
 */
export class ClaudeMemoriesFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'claude-memories',
    name: 'Claude Memories',
    category: RuleFormatCategory.MEMORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.claude/memories'
  };

  /**
   * Generate memory file for Claude
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
   * Check if rule is compatible with Claude memories format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Only generate memory files for non-root rules
    return !rule.isRoot;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = `${rule.name || 'default'}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Claude memories format
   */
  protected transformContent(rule: ParsedRule): string {
    // Claude uses plain markdown, remove any frontmatter
    let content = rule.content;
    
    // Remove YAML frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    
    return content;
  }
}
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
 * GitHub Copilot rule formatter
 * Generates .github/instructions/{name}.instructions.md files with frontmatter
 */
export class CopilotFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'copilot',
    name: 'GitHub Copilot',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.instructions.md',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.github/instructions'
  };

  /**
   * Generate rule file for GitHub Copilot
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
   * Check if rule is compatible with Copilot format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Copilot supports all rules
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
   * Transform rule content for Copilot format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;

    // Add frontmatter if not already present
    if (!content.startsWith('---')) {
      const frontmatter = this.createFrontmatter(rule);
      content = `${frontmatter}\n\n${content}`;
    }

    return content;
  }

  /**
   * Create frontmatter for GitHub Copilot
   */
  private createFrontmatter(rule: ParsedRule): string {
    const title = rule.metadata?.title || this.extractTitleFromContent(rule.content) || 'AI Rules';
    
    const metadata: any = {
      name: title,
      ...rule.metadata
    };

    // Remove title from metadata since it's already in name
    delete metadata.title;

    const frontmatterLines = Object.entries(metadata)
      .map(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return `${key}: ${stringValue}`;
      });

    return `---\n${frontmatterLines.join('\n')}\n---`;
  }

  /**
   * Extract title from markdown content
   */
  private extractTitleFromContent(content: string): string | null {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch?.[1]?.trim() || null;
  }
}
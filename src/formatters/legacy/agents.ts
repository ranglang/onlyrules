import { join } from 'node:path';
import { ONLEYRULES_ALL_TARGETS } from '../../consts';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../../core/interfaces';

/**
 * Legacy Agents formatter
 * Generates AGENTS.md file
 */
export class AgentsFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: ONLEYRULES_ALL_TARGETS.AGENTS,
    name: 'Agents (Legacy)',
    category: 'root',
    extension: '.md',
    supportsMultipleRules: false,
    requiresMetadata: false,
    defaultPath: 'AGENTS.md',
  };

  constructor() {
    super(AgentsFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for Agents format
   */
  protected configureFrontmatterPipeline(): void {
    // Agents doesn't use frontmatter, so no pipeline steps needed
  }

  /**
   * Generate file for Agents
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
   * Check if rule is compatible with Agents format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Legacy format, accepts all rules
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    return join(context.outputDir, this.spec.defaultPath);
  }

  /**
   * Transform rule content for Agents format
   */
  protected transformContent(rule: ParsedRule): string {
    // Remove any frontmatter
    let content = rule.content;
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    return content;
  }
}

import { join } from 'node:path';
import {
  ApplyType,
  BaseRuleFormatter,
  CommonFrontmatterSteps,
  FrontmatterPipelineStep,
  ParsedRule,
  RuleFormatCategory,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationResult,
} from '../core/interfaces';

/**
 * Cursor IDE rule formatter
 * Generates .cursor/rules/{name}.mdc files with YAML frontmatter
 */
export class CursorFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: 'cursor',
    name: 'Cursor IDE',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.mdc',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.cursor/rules',
  };

  constructor() {
    super(CursorFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for Cursor format
   */
  protected configureFrontmatterPipeline(): void {
    this.frontmatterPipeline
      .addStep(this.createAlwaysApplyStep())
      .addStep(CommonFrontmatterSteps.addGlob())
      .addStep(CommonFrontmatterSteps.addDescription());
  }

  /**
   * Create Cursor-specific alwaysApply step
   */
  private createAlwaysApplyStep(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        const applyType = this.determineApplyType(rule);
        metadata.alwaysApply = applyType === 'always';
        return metadata;
      },
    };
  }

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
    const sanitizedName = this.sanitizeFileName(rule.name || 'default');
    const filename = `${sanitizedName}${this.spec.extension}`;
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Cursor format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;

    // Remove existing frontmatter and get clean content
    content = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    // Generate frontmatter using the pipeline
    const frontmatter = this.generateFrontmatter(rule);

    return frontmatter ? `${frontmatter}\n\n${content}` : content;
  }
}

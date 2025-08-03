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

export class AugmentcodeFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: 'augmentcode',
    name: 'Augmentcode',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.augment/rules',
  };

  constructor() {
    super(AugmentcodeFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for Augmentcode format
   */
  protected configureFrontmatterPipeline(): void {
    this.frontmatterPipeline
      .addStep(this.createAugmentApplyTypeStep())
      .addStep(this.createAugmentDescriptionStep());
  }

  /**
   * Create Augmentcode-specific apply type step
   */
  private createAugmentApplyTypeStep(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        // Check if content is effectively empty (after removing frontmatter)
        const cleanContent = rule.content?.replace(/^---\n[\s\S]*?\n---\n?/, '').trim() || '';
        const isEffectivelyEmpty = !rule.content || rule.content.trim().length === 0 || cleanContent.length === 0;
        
        // Determine apply type based on rule characteristics
        if (rule.name?.includes('general') || rule.name?.includes('guidelines') || rule.name?.includes('always-included')) {
          metadata.type = 'always_apply';
        } else if (rule.name?.includes('specific-task') || isEffectivelyEmpty) {
          metadata.type = 'manual';
        } else if (rule.name?.includes('react') || rule.name?.includes('typescript')) {
          metadata.type = 'agent_requested';
        } else {
          const applyType = this.determineApplyType(rule);
          metadata.type = applyType === 'auto' ? 'agent_requested' : applyType;
        }
        return metadata;
      },
    };
  }

  /**
   * Create Augmentcode-specific description step
   */
  private createAugmentDescriptionStep(): FrontmatterPipelineStep {
    return {
      process: (rule: ParsedRule, metadata: Record<string, unknown>) => {
        // Extract description from rule content or metadata
        if (rule.description) {
          metadata.description = rule.description;
        } else if (rule.content) {
          // Extract first line after header as description
          const lines = rule.content.split('\n').filter(line => line.trim());
          const headerIndex = lines.findIndex(line => line.startsWith('#'));
          if (headerIndex >= 0 && headerIndex < lines.length - 1) {
            const nextLine = lines[headerIndex + 1];
            if (nextLine && nextLine.startsWith('-')) {
              // Use first bullet point as description
              metadata.description = nextLine.replace(/^-\s*/, '');
            }
          }
        }
        
        // Always include description field even if empty
        if (!metadata.description) {
          metadata.description = '';
        }
        
        return metadata;
      },
    };
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
    const fileName = this.sanitizeFileName(rule.name) + this.spec.extension;
    return join(context.outputDir, this.spec.defaultPath, fileName);
  }

  protected transformContent(rule: ParsedRule): string {
    // Remove existing frontmatter and get clean content
    const content = rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

    // Generate frontmatter using the pipeline
    const frontmatter = this.generateFrontmatter(rule);

    return frontmatter ? `${frontmatter}\n\n${content}` : content;
  }
}

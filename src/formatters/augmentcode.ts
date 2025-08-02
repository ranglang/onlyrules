import { join } from 'node:path';
import {
  BaseRuleFormatter,
  RuleFormatSpec,
  RuleFormatCategory,
  ParsedRule,
  RuleGenerationContext,
  RuleGenerationResult
} from '../core/interfaces';

export class AugmentcodeFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'augmentcode',
    name: 'Augmentcode',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: false,
    defaultPath: '.augment/rules'
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
    const fileName = this.sanitizeFileName(rule.name) + this.spec.extension;
    return join(context.outputDir, this.spec.defaultPath, fileName);
  }

  protected transformContent(rule: ParsedRule): string {
    // Remove frontmatter and return clean content
    const content = rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    
    // Add rule type comment based on content analysis
    const ruleType = this.determineRuleType(content);
    const typeComment = `<!-- Rule Type: ${ruleType} -->\n\n`;
    
    return typeComment + content;
  }

  /**
   * Determines the rule type based on content analysis
   * Always: contents will be included in every user message
   * Manual: needs to be tagged through @ attaching the Rules file manually  
   * Auto: Agent will automatically detect and attach rules based on a description field
   */
  private determineRuleType(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Check for keywords that suggest always-included rules
    if (lowerContent.includes('always') || 
        lowerContent.includes('every message') || 
        lowerContent.includes('general') ||
        lowerContent.includes('coding guidelines') ||
        lowerContent.includes('coding standard')) {
      return 'Always';
    }
    
    // Check for keywords that suggest auto-detection rules
    if (lowerContent.includes('auto') || 
        lowerContent.includes('detect') || 
        lowerContent.includes('framework') ||
        lowerContent.includes('library') ||
        lowerContent.includes('react') ||
        lowerContent.includes('vue') ||
        lowerContent.includes('angular') ||
        lowerContent.includes('typescript') ||
        lowerContent.includes('javascript')) {
      return 'Auto';
    }
    
    // Default to Manual for specific or targeted rules
    return 'Manual';
  }
}

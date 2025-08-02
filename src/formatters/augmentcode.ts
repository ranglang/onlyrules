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
    // Remove existing frontmatter and get clean content
    const content = rule.content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    
    // Determine rule type and generate metadata
    const ruleType = this.determineAugmentRuleType(content);
    const description = this.generateDescription(rule.name, content);
    
    // Create frontmatter with type and description
    const frontmatter = `---\ntype: "${ruleType}"\ndescription: "${description}"\n---\n\n`;
    
    return frontmatter + content;
  }

  /**
   * Generates a description for the rule based on its name and content
   */
  private generateDescription(ruleName: string, content: string): string {
    // Extract first line of content as description, or use rule name
    const lines = content.split('\n').filter(line => line.trim());
    const firstContentLine = lines.find(line => !line.startsWith('#') && line.trim());
    
    if (firstContentLine && firstContentLine.length > 10) {
      // Use first meaningful content line, truncated if too long
      const desc = firstContentLine.replace(/^[\-\*\+]\s*/, '').trim();
      return desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
    }
    
    // Fallback to formatted rule name
    return ruleName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' guidelines';
  }

  /**
   * Determines the Augment rule type based on content analysis
   * Returns appropriate type for Augment's rule system
   */
  private determineAugmentRuleType(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Check for keywords that suggest always-included rules
    if (lowerContent.includes('always') || 
        lowerContent.includes('every message') || 
        lowerContent.includes('general') ||
        lowerContent.includes('coding guidelines') ||
        lowerContent.includes('coding standard')) {
      return 'always_apply';
    }
    
    // Check for keywords that suggest auto-detection rules
    if (lowerContent.includes('auto') || 
        lowerContent.includes('agent_requested') || 
        lowerContent.includes('detect') || 
        lowerContent.includes('framework') ||
        lowerContent.includes('library') ||
        lowerContent.includes('react') ||
        lowerContent.includes('vue') ||
        lowerContent.includes('angular') ||
        lowerContent.includes('typescript') ||
        lowerContent.includes('javascript')) {
      return 'agent_requested';
    }
    
    // Default to agent_requested as specified by user
    return 'manual';
  }

  /**
   * Legacy method for backward compatibility (kept for tests)
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

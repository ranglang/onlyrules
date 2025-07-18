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
 * Kiro AI assistant rule formatter
 * Generates .kiro/steering/{name}.md files with YAML frontmatter for inclusion modes
 */
export class KiroFormatter extends BaseRuleFormatter {
  readonly spec: RuleFormatSpec = {
    id: 'kiro',
    name: 'Kiro AI',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.kiro/steering'
  };

  // Default steering files that Kiro creates automatically
  private readonly defaultFiles = ['product.md', 'tech.md', 'structure.md'];

  /**
   * Generate rule file for Kiro AI
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
      
      // Transform content with Kiro-specific formatting
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
   * Check if rule is compatible with Kiro format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // Kiro supports all rules
    return true;
  }

  /**
   * Get output file path for the rule
   */
  getOutputPath(rule: ParsedRule, context: RuleGenerationContext): string {
    const filename = this.getFileName(rule);
    return join(context.outputDir, this.spec.defaultPath, filename);
  }

  /**
   * Transform rule content for Kiro format
   */
  protected transformContent(rule: ParsedRule): string {
    let content = rule.content;

    // Add YAML frontmatter based on rule metadata
    const frontmatter = this.createFrontmatter(rule);
    if (frontmatter) {
      content = `${frontmatter}\n${content}`;
    }

    return content;
  }

  /**
   * Get appropriate filename based on rule name and type
   */
  private getFileName(rule: ParsedRule): string {
    // Use standardized names for common rule types
    const name = rule.name.toLowerCase();
    
    // Map common rule names to Kiro's default files
    if (name.includes('product') || name.includes('overview')) {
      return 'product.md';
    } else if (name.includes('tech') || name.includes('stack') || name.includes('technology')) {
      return 'tech.md';
    } else if (name.includes('structure') || name.includes('architecture')) {
      return 'structure.md';
    }
    
    // For other rules, use descriptive filenames
    const filename = rule.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${filename}${this.spec.extension}`;
  }

  /**
   * Create YAML frontmatter for Kiro inclusion modes
   */
  private createFrontmatter(rule: ParsedRule): string {
    const metadata = rule.metadata || {};
    
    // Determine inclusion mode based on rule metadata or defaults
    let inclusionConfig: any = {};
    
    if (metadata.inclusion) {
      // Use explicit inclusion mode if specified
      inclusionConfig.inclusion = metadata.inclusion;
      
      // Add file match pattern if specified
      if (metadata.inclusion === 'fileMatch' && metadata.fileMatchPattern) {
        inclusionConfig.fileMatchPattern = metadata.fileMatchPattern;
      }
    } else {
      // Apply smart defaults based on rule characteristics
      if (rule.isRoot || this.isDefaultFile(rule.name)) {
        // Default files and root rules are always included
        inclusionConfig.inclusion = 'always';
      } else if (this.hasFilePatternHint(rule)) {
        // If the rule seems specific to certain files, use fileMatch
        inclusionConfig.inclusion = 'fileMatch';
        inclusionConfig.fileMatchPattern = this.inferFilePattern(rule);
      } else {
        // Default to manual inclusion for specialized rules
        inclusionConfig.inclusion = 'manual';
      }
    }

    // Only add frontmatter if not using default 'always' mode
    if (inclusionConfig.inclusion === 'always' && !metadata.inclusion) {
      return '';
    }

    const frontmatterLines = Object.entries(inclusionConfig)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

    return `---\n${frontmatterLines.join('\n')}\n---\n`;
  }

  /**
   * Check if this is one of Kiro's default files
   */
  private isDefaultFile(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this.defaultFiles.some(defaultFile => 
      lowerName.includes(defaultFile.replace('.md', ''))
    );
  }

  /**
   * Check if rule content suggests it's for specific file types
   */
  private hasFilePatternHint(rule: ParsedRule): boolean {
    const indicators = [
      'component', 'api', 'test', 'route', 'endpoint',
      'tsx', 'jsx', 'vue', 'react', 'angular',
      'backend', 'frontend', 'database', 'migration'
    ];
    
    const lowerContent = (rule.name + ' ' + rule.content).toLowerCase();
    return indicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Infer file pattern based on rule content and name
   */
  private inferFilePattern(rule: ParsedRule): string {
    const name = rule.name.toLowerCase();
    const content = rule.content.toLowerCase();
    
    // Common patterns based on rule type
    if (name.includes('component') || content.includes('component')) {
      return 'components/**/*.{tsx,jsx,vue}';
    } else if (name.includes('api') || name.includes('endpoint')) {
      return 'app/api/**/*';
    } else if (name.includes('test')) {
      return '**/*.{test,spec}.{ts,tsx,js,jsx}';
    } else if (name.includes('style') || name.includes('css')) {
      return '**/*.{css,scss,sass,less}';
    } else if (name.includes('config')) {
      return '*.config.{js,ts,json}';
    }
    
    // Default to all TypeScript/JavaScript files
    return '**/*.{ts,tsx,js,jsx}';
  }
}
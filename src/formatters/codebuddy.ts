import { join } from 'node:path';
import {
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
 * Tencent Cloud CodeBuddy rule formatter
 * Generates .codebuddy/rules/{name}.md files for CodeBuddy AI assistant
 * CodeBuddy (腾讯云代码助手) is an AI-powered coding assistant that supports VS Code and JetBrains IDEs
 */
export class CodeBuddyFormatter extends BaseRuleFormatter {
  static readonly SPEC: RuleFormatSpec = {
    id: 'codebuddy',
    name: 'Tencent Cloud CodeBuddy',
    category: RuleFormatCategory.DIRECTORY_BASED,
    extension: '.md',
    supportsMultipleRules: true,
    requiresMetadata: true,
    defaultPath: '.codebuddy/rules',
  };

  constructor() {
    super(CodeBuddyFormatter.SPEC);
  }

  /**
   * Configure the frontmatter pipeline for CodeBuddy format
   * CodeBuddy doesn't use traditional frontmatter, so this is minimal
   */
  protected configureFrontmatterPipeline(): void {
    // CodeBuddy uses custom header format instead of frontmatter
    // Pipeline is configured but not used in transformContent
    this.frontmatterPipeline.addStep(CommonFrontmatterSteps.addDescription());
  }

  /**
   * Generate rule file for CodeBuddy
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
   * Check if rule is compatible with CodeBuddy format
   */
  isRuleCompatible(rule: ParsedRule): boolean {
    // CodeBuddy supports all rules
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
   * Transform rule content for CodeBuddy format
   */
  protected transformContent(rule: ParsedRule): string {
    const content = rule.content;

    // Add header with metadata for CodeBuddy
    const header = this.createHeader(rule);

    // Format content with proper markdown structure
    const formattedContent = this.formatContent(content, rule);

    return `${header}\n\n${formattedContent}`;
  }

  /**
   * Create header for CodeBuddy rule file
   */
  private createHeader(rule: ParsedRule): string {
    const lines: string[] = [];

    // Add title
    lines.push(`# ${rule.name || 'CodeBuddy Development Rule'}`);
    lines.push('');

    // Add metadata section if metadata exists
    if (rule.metadata && Object.keys(rule.metadata).length > 0) {
      lines.push('## Metadata');
      lines.push('');
      lines.push('```yaml');
      for (const [key, value] of Object.entries(rule.metadata)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        lines.push(`${key}: ${stringValue}`);
      }
      lines.push('```');
      lines.push('');
    }

    // Add rule type indicator
    lines.push('## Rule Type');
    lines.push('');
    lines.push(
      `- **Type**: ${rule.isRoot ? 'Global Rule (Always Active)' : 'Project-Specific Rule'}`
    );
    lines.push('- **AI Assistant**: Tencent Cloud CodeBuddy');
    lines.push('- **Supported IDEs**: VS Code, JetBrains IDEs');
    lines.push('');

    // Add usage instructions
    lines.push('## Usage');
    lines.push('');
    lines.push('This rule will be automatically loaded by CodeBuddy when:');
    if (rule.isRoot) {
      lines.push('- CodeBuddy is active in your IDE (always applied)');
    } else {
      lines.push('- You are working in this project directory');
      lines.push('- CodeBuddy detects the `.codebuddy` configuration');
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Format the rule content with proper sections
   */
  private formatContent(content: string, rule: ParsedRule): string {
    const lines: string[] = [];

    // Add main rule section
    lines.push('## Development Guidelines');
    lines.push('');

    // Process the content
    const contentLines = content.split('\n');
    for (const line of contentLines) {
      // Ensure proper markdown formatting
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        // It's already a list item
        lines.push(line);
      } else if (line.trim() === '') {
        // Empty line
        lines.push('');
      } else if (line.match(/^#+\s/)) {
        // It's a heading, bump it down one level to maintain hierarchy
        lines.push(`#${line}`);
      } else {
        // Regular text
        lines.push(line);
      }
    }

    // Add footer with additional CodeBuddy-specific instructions
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('### CodeBuddy Integration Notes');
    lines.push('');
    lines.push('- CodeBuddy will use these guidelines to provide context-aware code suggestions');
    lines.push('- The AI assistant will follow these rules when generating code completions');
    lines.push("- Use CodeBuddy's chat feature to ask questions about these guidelines");
    lines.push("- These rules work with CodeBuddy's MCP (Model Context Protocol) integration");

    return lines.join('\n');
  }
}

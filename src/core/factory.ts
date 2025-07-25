import { BaseRuleFormatter, RuleFormatterFactory, RuleFormatCategory } from './interfaces';

// Import all formatters
import { CursorFormatter } from '../formatters/cursor';
import { CopilotFormatter } from '../formatters/copilot';
import { ClineFormatter } from '../formatters/cline';
import { ClaudeRootFormatter } from '../formatters/claude-root';
import { ClaudeMemoriesFormatter } from '../formatters/claude-memories';
import { GeminiRootFormatter } from '../formatters/gemini-root';
import { GeminiMemoriesFormatter } from '../formatters/gemini-memories';
import { RooFormatter } from '../formatters/roo';
import { KiroFormatter } from '../formatters/kiro';
import { CodeBuddyFormatter } from '../formatters/codebuddy';

// Legacy formatters
import { AgentsFormatter } from '../formatters/legacy/agents';
import { JunieFormatter } from '../formatters/legacy/junie';
import { WindsurfFormatter } from '../formatters/legacy/windsurf';
import { TraeFormatter } from '../formatters/legacy/trae';
import { AugmentFormatter } from '../formatters/legacy/augment';
import { AugmentAlwaysFormatter } from '../formatters/legacy/augment-always';
import { LingmaProjectFormatter } from '../formatters/legacy/lingma-project';

/**
 * Default implementation of the rule formatter factory
 */
export class DefaultRuleFormatterFactory implements RuleFormatterFactory {
  private formatters = new Map<string, BaseRuleFormatter>();

  constructor() {
    // Register all built-in formatters
    this.registerBuiltInFormatters();
  }

  /**
   * Get all available formatters
   */
  getAvailableFormatters(): Map<string, BaseRuleFormatter> {
    return new Map(this.formatters);
  }

  /**
   * Get a specific formatter by ID
   */
  getFormatter(formatId: string): BaseRuleFormatter | undefined {
    return this.formatters.get(formatId);
  }

  /**
   * Register a new formatter
   */
  registerFormatter(formatter: BaseRuleFormatter): void {
    this.formatters.set(formatter.spec.id, formatter);
  }

  /**
   * Get formatters by category
   */
  getFormattersByCategory(category: RuleFormatCategory): BaseRuleFormatter[] {
    return Array.from(this.formatters.values()).filter(
      formatter => formatter.spec.category === category
    );
  }

  /**
   * Get all format IDs
   */
  getAvailableFormatIds(): string[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(formatId: string): boolean {
    return this.formatters.has(formatId);
  }

  /**
   * Register all built-in formatters
   */
  private registerBuiltInFormatters(): void {
    // Register all formatters
    this.registerFormatter(new CursorFormatter());
    this.registerFormatter(new CopilotFormatter());
    this.registerFormatter(new ClineFormatter());
    this.registerFormatter(new ClaudeRootFormatter());
    this.registerFormatter(new ClaudeMemoriesFormatter());
    this.registerFormatter(new GeminiRootFormatter());
    this.registerFormatter(new GeminiMemoriesFormatter());
    this.registerFormatter(new RooFormatter());
    this.registerFormatter(new KiroFormatter());
    this.registerFormatter(new CodeBuddyFormatter());
    
    // Legacy formatters
    this.registerFormatter(new AgentsFormatter());
    this.registerFormatter(new JunieFormatter());
    this.registerFormatter(new WindsurfFormatter());
    this.registerFormatter(new TraeFormatter());
    this.registerFormatter(new AugmentFormatter());
    this.registerFormatter(new AugmentAlwaysFormatter());
    this.registerFormatter(new LingmaProjectFormatter());
  }

  /**
   * Get recommended formatters for common use cases
   */
  getRecommendedFormatters(): BaseRuleFormatter[] {
    return [
      this.getFormatter('cursor'),
      this.getFormatter('copilot'),
      this.getFormatter('cline'),
      this.getFormatter('claude-root'),
      this.getFormatter('gemini-root')
    ].filter(Boolean) as BaseRuleFormatter[];
  }

  /**
   * Get formatters that support multiple rules
   */
  getMultiRuleFormatters(): BaseRuleFormatter[] {
    return Array.from(this.formatters.values()).filter(
      formatter => formatter.spec.supportsMultipleRules
    );
  }
}
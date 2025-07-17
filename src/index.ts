// Export public API
export { generateRules } from './core/generator';
export { RuleFormat, CliArgs, RuleGenerationOptions, RuleTemplate } from './types';
export { readRulesFromUrl, readRulesFromFile, readLingmaProjectRules } from './utils/reader';
export { writeRulesToFile } from './utils/writer';

// Export new plugin-based architecture
export {
  getAvailableFormats,
  getFormatsByCategory,
  isFormatSupported
} from './core/generator-v2';

export {
  BaseRuleFormatter,
  RuleFormatSpec,
  RuleFormatCategory,
  ParsedRule,
  RuleGenerationContext,
  RuleGenerationResult,
  RuleGenerationPipeline,
  RuleGenerationPipelineOptions
} from './core/interfaces';

export { DefaultRuleGenerationPipeline } from './core/pipeline';
export { DefaultRuleParser } from './core/parser';
export { DefaultRuleFormatterFactory } from './core/factory';

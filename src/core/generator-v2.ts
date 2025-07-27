import { RuleGenerationOptions } from '../types';
import {
  RuleGenerationPipelineOptions,
  RuleGenerationResult
} from './interfaces';
import { DefaultRuleGenerationPipeline } from './pipeline';
import chalk from 'chalk';

/**
 * Enhanced rule generation function using the new plugin-based architecture
 * Maintains backward compatibility with existing RuleGenerationOptions
 */
export async function generateRules(options: RuleGenerationOptions): Promise<void> {
  const pipeline = new DefaultRuleGenerationPipeline();

  try {
    // Convert legacy options to new pipeline options
    const pipelineOptions = convertLegacyOptions(options);
    
    // Execute the pipeline
    const results = await pipeline.execute(pipelineOptions);
    
    // Log results in the same format as the legacy system
    logLegacyCompatibleResults(results, options.verbose);
    
  } catch (error) {
    throw new Error(`Failed to generate rules: ${(error as Error).message}`);
  }
}

/**
 * Map target names to formatter IDs
 */
function mapTargetsToFormatterIds(targets: string[]): string[] {
  const targetMap: Record<string, string> = {
    // Modern formatters
    'cursor': 'cursor',
    'copilot': 'copilot', 
    'cline': 'cline',
    'claude': 'claude-root',
    'claude-root': 'claude-root',
    'claude-memories': 'claude-memories',
    'gemini': 'gemini-root',
    'gemini-root': 'gemini-root', 
    'gemini-memories': 'gemini-memories',
    'roo': 'roo',
    'kiro': 'kiro',
    'codebuddy': 'codebuddy',
    
    // Legacy formatters
    'agents': 'agents',
    'junie': 'junie',
    'windsurf': 'windsurf',
    'trae': 'trae',
    'augment': 'augment',
    'augment-always': 'augment-always',
    'lingma': 'lingma-project',
    'lingma-project': 'lingma-project'
  };

  return targets
    .map(target => targetMap[target.toLowerCase()])
    .filter(Boolean); // Remove undefined values
}

/**
 * Convert legacy RuleGenerationOptions to new pipeline options
 */
function convertLegacyOptions(options: RuleGenerationOptions): RuleGenerationPipelineOptions {
  // Determine input source
  let input: string | { content: string; filePath?: string };
  
  if (options.rulesContent) {
    // Direct content provided
    input = { content: options.rulesContent };
  } else if (options.file) {
    // File path provided
    input = options.file;
  } else {
    // Default to rulesync.mdc
    input = './rulesync.mdc';
  }

  // Handle target filtering
  let formats: string[] | undefined;
  if (options.target && options.target.length > 0) {
    // Map target names to formatter IDs
    formats = mapTargetsToFormatterIds(options.target);
    if (formats.length === 0) {
      console.warn(chalk.yellow(`⚠ No valid formatters found for targets: ${options.target.join(', ')}`));
    }
  } else if (options.formats) {
    // Convert legacy format names to new format IDs
    formats = options.formats.map(convertLegacyFormatToId);
  }

  return {
    input,
    outputDir: options.output,
    formats,
    force: options.force,
    verbose: options.verbose,
    ideStyle: options.ideStyle,
    ideFolder: options.ideFolder
  };
}

/**
 * Convert legacy RuleFormat enum values to new format IDs
 */
function convertLegacyFormatToId(legacyFormat: any): string {
  // Map legacy enum values to new IDs
  const formatMapping: Record<string, string> = {
    '.github/instructions': 'copilot',
    '.cursor/rules': 'cursor',
    '.clinerules': 'cline',
    'CLAUDE.md': 'claude-root',
    '.claude/memories': 'claude-memories',
    '.roo/rules': 'roo',
    'GEMINI.md': 'gemini-root',
    '.gemini/memories': 'gemini-memories',
    'AGENTS.md': 'agents',
    '.junie/guidelines.md': 'junie',
    '.windsurfrules': 'windsurf',
    '.trae/rules.md': 'trae',
    '.augment-guidelines': 'augment',
    '.augment/rules/always.md': 'augment-always',
    '.lingma/rules': 'lingma-project'
  };

  return formatMapping[legacyFormat] || legacyFormat;
}

/**
 * Log results in legacy-compatible format
 */
function logLegacyCompatibleResults(results: RuleGenerationResult[], verbose?: boolean): void {
  if (verbose) {
    results.forEach((result) => {
      if (result.success) {
        console.log(chalk.green(`✓ Generated ${result.format} for rule '${result.ruleName}'`));
      } else {
        console.log(chalk.red(`✗ Failed to generate ${result.format} for rule '${result.ruleName}': ${result.error}`));
      }
    });
  }

  // Count successes and failures
  const successes = results.filter(r => r.success).length;
  const failures = results.length - successes;

  // Extract unique rule names
  const uniqueRules = new Set(results.map(r => r.ruleName).filter(Boolean));
  const ruleCount = uniqueRules.size;

  // Log summary in legacy format
  console.log(
    chalk.bold(
      `Generated ${chalk.green(successes)} rule files${
        ruleCount > 1 ? ` across ${ruleCount} rules` : ''
      }${failures > 0 ? `, ${chalk.red(failures)} failed` : ''}`
    )
  );
}

/**
 * Get available format specifications for CLI help
 */
export function getAvailableFormats(): string[] {
  const pipeline = new DefaultRuleGenerationPipeline();
  return pipeline.getAvailableFormats().map(spec => spec.id);
}

/**
 * Get format specifications grouped by category
 */
export function getFormatsByCategory(): { [category: string]: string[] } {
  const pipeline = new DefaultRuleGenerationPipeline();
  const formats = pipeline.getAvailableFormats();
  
  const grouped: { [category: string]: string[] } = {};
  
  for (const format of formats) {
    const category = format.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(format.id);
  }
  
  return grouped;
}

/**
 * Check if a specific format is supported
 */
export function isFormatSupported(formatId: string): boolean {
  const pipeline = new DefaultRuleGenerationPipeline();
  return pipeline.getAvailableFormats().some(spec => spec.id === formatId);
}
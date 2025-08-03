import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

import { toSnakeCase } from '../utils/file-utils';
import { readRulesFromFile, readRulesFromUrl } from '../utils/reader';
import { DefaultRuleFormatterFactory } from './factory';
import {
  BaseRuleFormatter,
  ParsedRule,
  RuleFormatSpec,
  RuleGenerationContext,
  RuleGenerationPipeline,
  RuleGenerationPipelineOptions,
  RuleGenerationResult,
} from './interfaces';
import { DefaultRuleParser } from './parser';

/**
 * Main rule generation pipeline implementation
 */
export class DefaultRuleGenerationPipeline implements RuleGenerationPipeline {
  private parser = new DefaultRuleParser();
  private factory = new DefaultRuleFormatterFactory();

  /**
   * Execute the complete rule generation pipeline
   */
  async execute(options: RuleGenerationPipelineOptions): Promise<RuleGenerationResult[]> {
    const results: RuleGenerationResult[] = [];

    try {
      // Parse input content
      const rules = await this.parseInput(options.input);

      // Validate rules
      if (!this.parser.validateRules(rules)) {
        throw new Error('Invalid rules content');
      }

      // Get formatters to use
      const formatters = this.getFormattersToUse(options.formats);

      // Create generation context
      const context: RuleGenerationContext = {
        outputDir: options.outputDir,
        force: options.force ?? false,
        verbose: options.verbose ?? false,
      };

      // Handle IDE-style organization if requested
      if (options.ideStyle !== false) {
        const ideResults = await this.handleIdeStyleGeneration(rules, options);
        results.push(...ideResults);
      }

      // Generate files for each formatter and rule combination
      for (const formatter of formatters) {
        for (const rule of rules) {
          // Check if formatter supports this rule
          if (!formatter.isRuleCompatible(rule)) {
            if (options.verbose) {
              console.log(
                chalk.yellow(
                  `⚠ Skipping ${formatter.spec.name} for rule '${rule.name}' (incompatible)`
                )
              );
            }
            continue;
          }

          try {
            const result = await formatter.generateRule(rule, context);
            results.push(result);

            if (options.verbose) {
              if (result.success) {
                console.log(
                  chalk.green(`✓ Generated ${result.format} for rule '${result.ruleName}'`)
                );
              } else {
                console.log(
                  chalk.red(
                    `✗ Failed to generate ${result.format} for rule '${result.ruleName}': ${result.error}`
                  )
                );
              }
            }
          } catch (error) {
            const errorResult: RuleGenerationResult = {
              format: formatter.spec.id,
              success: false,
              error: (error as Error).message,
              ruleName: rule.name,
            };
            results.push(errorResult);

            if (options.verbose) {
              console.log(
                chalk.red(`✗ Error generating ${formatter.spec.name}: ${errorResult.error}`)
              );
            }
          }
        }
      }

      // Log summary
      this.logSummary(results, options.verbose);

      return results;
    } catch (error) {
      throw new Error(`Pipeline execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get available format specifications
   */
  getAvailableFormats(): RuleFormatSpec[] {
    return Array.from(this.factory.getAvailableFormatters().values()).map(
      (formatter) => formatter.spec
    );
  }

  /**
   * Register custom formatter
   */
  registerFormatter(formatter: BaseRuleFormatter): void {
    this.factory.registerFormatter(formatter);
  }

  /**
   * Parse input content from various sources
   */
  private async parseInput(
    input: string | { content: string; filePath?: string }
  ): Promise<ParsedRule[]> {
    let content: string;
    let filePath: string | undefined;

    if (typeof input === 'string') {
      // Input is a file path or URL
      if (input.startsWith('http://') || input.startsWith('https://')) {
        content = await readRulesFromUrl(input);
        filePath = input.split('/').pop();
      } else {
        content = await readRulesFromFile(input);
        filePath = input;
      }
    } else {
      // Input is direct content
      content = input.content;
      filePath = input.filePath;
    }

    return this.parser.parseRules(content, filePath);
  }

  /**
   * Get formatters to use based on options
   */
  private getFormattersToUse(requestedFormats?: string[]): BaseRuleFormatter[] {
    if (!requestedFormats || requestedFormats.length === 0) {
      // Use all available formatters
      return Array.from(this.factory.getAvailableFormatters().values());
    }

    // Use only requested formatters
    const formatters: BaseRuleFormatter[] = [];
    for (const formatId of requestedFormats) {
      const formatter = this.factory.getFormatter(formatId);
      if (formatter) {
        formatters.push(formatter);
      } else {
        console.warn(chalk.yellow(`⚠ Unknown format: ${formatId}`));
      }
    }

    return formatters;
  }

  /**
   * Handle IDE-style rule organization
   */
  private async handleIdeStyleGeneration(
    rules: ParsedRule[],
    options: RuleGenerationPipelineOptions
  ): Promise<RuleGenerationResult[]> {
    const results: RuleGenerationResult[] = [];

    if (rules.length <= 1) {
      return results; // No need for IDE-style with single rule
    }

    const ideOutputDir = join(options.outputDir, options.ideFolder || '.rules');

    // Create the directory if it doesn't exist
    if (!existsSync(ideOutputDir)) {
      await mkdir(ideOutputDir, { recursive: true });
    }

    // Process each rule and write it to the IDE directory
    for (const rule of rules) {
      if (!rule.name) continue; // Skip rules without names

      // Convert rule name to snake_case for file naming
      const fileName = toSnakeCase(rule.name);
      const ruleFilePath = join(ideOutputDir, `${fileName}.mdc`);

      try {
        // Check if file exists and we're not forcing overwrite
        if (existsSync(ruleFilePath) && !options.force) {
          results.push({
            format: 'ide-style',
            success: false,
            error: `File ${ruleFilePath} already exists. Use --force to overwrite.`,
            ruleName: rule.name,
            filePath: ruleFilePath,
          });
          continue;
        }

        // Create rule content with metadata
        let fileContent = rule.content;
        if (rule.metadata && Object.keys(rule.metadata).length > 0) {
          const frontmatter = Object.entries(rule.metadata)
            .map(
              ([key, value]) =>
                `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`
            )
            .join('\n');
          fileContent = `---\n${frontmatter}\n---\n\n${rule.content}`;
        }

        // Write the rule content to the file
        await writeFile(ruleFilePath, fileContent);

        results.push({
          format: 'ide-style',
          success: true,
          ruleName: rule.name,
          filePath: ruleFilePath,
        });

        if (options.verbose) {
          console.log(chalk.green(`✓ Created IDE-style rule file: ${ruleFilePath}`));
        }
      } catch (error) {
        results.push({
          format: 'ide-style',
          success: false,
          error: (error as Error).message,
          ruleName: rule.name,
          filePath: ruleFilePath,
        });

        if (options.verbose) {
          console.log(
            chalk.red(`✗ Failed to create IDE-style rule file: ${(error as Error).message}`)
          );
        }
      }
    }

    return results;
  }

  /**
   * Log generation summary
   */
  private logSummary(results: RuleGenerationResult[], verbose?: boolean): void {
    const successes = results.filter((r) => r.success).length;
    const failures = results.length - successes;

    console.log(
      chalk.bold(
        `Generated ${chalk.green(successes)} rule files${
          failures > 0 ? `, ${chalk.red(failures)} failed` : ''
        }`
      )
    );

    // Show breakdown by format if verbose
    if (verbose && results.length > 0) {
      const formatCounts = new Map<string, { success: number; failed: number }>();

      for (const result of results) {
        const current = formatCounts.get(result.format) || { success: 0, failed: 0 };
        if (result.success) {
          current.success++;
        } else {
          current.failed++;
        }
        formatCounts.set(result.format, current);
      }

      console.log('\nBreakdown by format:');
      for (const [format, counts] of formatCounts) {
        const total = counts.success + counts.failed;
        const successRate = Math.round((counts.success / total) * 100);
        console.log(
          `  ${format}: ${chalk.green(counts.success)} success, ${chalk.red(
            counts.failed
          )} failed (${successRate}%)`
        );
      }
    }
  }
}

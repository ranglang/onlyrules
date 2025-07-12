import { readRulesFromUrl, readRulesFromFile } from '../utils/reader';
import { writeRulesToFile } from '../utils/writer';
import { RuleFormat, RuleGenerationOptions } from '../types';
import chalk from 'chalk';

/**
 * Generate rule files for different AI assistants
 * @param options Rule generation options
 */
export async function generateRules(options: RuleGenerationOptions): Promise<void> {
  // Get rules content
  let rulesContent: string;
  
  // If direct rulesContent is provided, use it
  if (options.rulesContent) {
    rulesContent = options.rulesContent;
  } else {
    // Use default file if neither url nor file is provided
    if (!options.url && !options.file) {
      options.file = './rulesync.md';
    }

    // Get rules content from file or URL
    try {
      if (options.url) {
        rulesContent = await readRulesFromUrl(options.url);
      } else if (options.file) {
        rulesContent = await readRulesFromFile(options.file);
      } else {
        throw new Error('Invalid options');
      }
    } catch (error) {
      throw new Error(`Failed to read rules: ${(error as Error).message}`);
    }
  }

  // Validate rules content
  if (!rulesContent || rulesContent.trim() === '') {
    throw new Error('Rules content is empty');
  }

  // Determine which formats to generate
  const formatsToGenerate = options.formats || Object.values(RuleFormat);

  // Generate rule files for each format
  const results = await Promise.allSettled(
    formatsToGenerate.map(async (format) => {
      try {
        await writeRulesToFile(format, rulesContent, options.output, options.force);
        return { format, success: true };
      } catch (error) {
        return { format, success: false, error: (error as Error).message };
      }
    })
  );

  // Log results if verbose
  if (options.verbose) {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          console.log(chalk.green(`✓ Generated ${result.value.format}`));
        } else {
          console.log(chalk.red(`✗ Failed to generate ${result.value.format}: ${result.value.error}`));
        }
      } else {
        console.log(chalk.red(`✗ Error: ${result.reason}`));
      }
    });
  }

  // Count successes and failures
  const successes = results.filter(
    (result) => result.status === 'fulfilled' && result.value.success
  ).length;
  const failures = results.length - successes;

  // Log summary
  console.log(
    chalk.bold(
      `Generated ${chalk.green(successes)} rule files${
        failures > 0 ? `, ${chalk.red(failures)} failed` : ''
      }`
    )
  );
}

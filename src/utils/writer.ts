import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { RuleFormat } from '../types';

/**
 * Check if the given format is a directory-based rule format
 * @param format Rule format to check
 * @returns True if the format is directory-based
 */
function isDirectoryBasedFormat(format: RuleFormat): boolean {
  return format === RuleFormat.LINGMA_PROJECT;
}

/**
 * Write rules content to a file or directory
 * @param format Rule format to write
 * @param content Rules content
 * @param outputDir Output directory
 * @param force Whether to force overwrite existing files
 */
export async function writeRulesToFile(
  format: RuleFormat,
  content: string,
  outputDir: string,
  force = false
): Promise<void> {
  const outputPath = join(outputDir, format);
  
  if (isDirectoryBasedFormat(format)) {
    // Handle directory-based formats like Lingma project rules
    try {
      // Create the directory if it doesn't exist
      await mkdir(outputPath, { recursive: true });
      
      // For Lingma project rules, write to a default.md file in the directory
      const defaultRulePath = join(outputPath, 'default.md');
      
      // Check if file exists and force is not enabled
      if (existsSync(defaultRulePath) && !force) {
        throw new Error(`File ${defaultRulePath} already exists. Use --force to overwrite.`);
      }
      
      // Write content to the default rule file
      await writeFile(defaultRulePath, content);
    } catch (error) {
      throw new Error(`Error writing rules to directory: ${(error as Error).message}`);
    }
  } else {
    // Handle regular file-based formats
    const outputDirPath = dirname(outputPath);

    // Check if file exists and force is not enabled
    if (existsSync(outputPath) && !force) {
      throw new Error(`File ${outputPath} already exists. Use --force to overwrite.`);
    }

    try {
      // Create directory if it doesn't exist
      await mkdir(outputDirPath, { recursive: true });
      
      // Write content to file
      await writeFile(outputPath, content);
    } catch (error) {
      throw new Error(`Error writing rules to file: ${(error as Error).message}`);
    }
  }
}

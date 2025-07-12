import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { RuleFormat } from '../types';

/**
 * Write rules content to a file
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

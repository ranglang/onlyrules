import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { RuleFormat } from '../types';
import { extractTitleFromMarkdown } from './templates';

/**
 * Check if the given format is a directory-based rule format
 * @param format Rule format to check
 * @returns True if the format is directory-based
 */
function isDirectoryBasedFormat(format: RuleFormat): boolean {
  return [
    RuleFormat.COPILOT,
    RuleFormat.CURSOR,
    RuleFormat.CLINE,
    RuleFormat.CLAUDE_MEMORIES,
    RuleFormat.ROO,
    RuleFormat.GEMINI_MEMORIES,
    RuleFormat.LINGMA_PROJECT,
  ].includes(format);
}

/**
 * Check if the format has a root file for global rules
 * @param format Rule format to check
 * @returns True if the format has a root file
 */
function hasRootFile(format: RuleFormat): boolean {
  return format === RuleFormat.CLAUDE_ROOT || format === RuleFormat.GEMINI_ROOT;
}

/**
 * Get the appropriate file extension for a given rule format
 * @param format Rule format
 * @returns File extension including the dot
 */
function getFileExtension(format: RuleFormat): string {
  switch (format) {
    case RuleFormat.CURSOR:
      return '.mdc'; // MDC format (YAML header + Markdown)
    default:
      return '.md'; // Default to markdown for most formats
  }
}

/**
 * Write rules content to a file or directory
 * @param format Rule format to write
 * @param content Rules content
 * @param outputDir Output directory
 * @param force Whether to force overwrite existing files
 * @param ruleName Optional rule name for non-root rules
 */
export async function writeRulesToFile(
  format: RuleFormat,
  content: string,
  outputDir: string,
  force = false,
  ruleName?: string
): Promise<void> {
  try {
    if (isDirectoryBasedFormat(format)) {
      // Handle directory-based formats
      const outputPath = join(outputDir, format);

      // Create the directory if it doesn't exist
      await mkdir(outputPath, { recursive: true });

      // Generate filename based on format and rule name
      let filename: string;
      let fileContent = content;

      // Format-specific handling
      switch (format) {
        case RuleFormat.COPILOT:
          // GitHub Copilot uses .instructions.md extension
          filename = `${ruleName || 'default'}.instructions.md`;
          // Add front matter if not already present
          if (!content.startsWith('---')) {
            const title = extractTitleFromMarkdown(content) || 'AI Rules';
            fileContent = `---
name: ${title}
---

${content}`;
          }
          break;

        case RuleFormat.CURSOR:
          // Cursor uses .mdc extension with YAML header
          filename = `${ruleName || 'default'}${getFileExtension(format)}`;
          // Add cursorRuleType if not already present
          if (!content.includes('cursorRuleType:')) {
            const isRoot = !ruleName || ruleName === 'default' || ruleName === 'root';
            const ruleType = isRoot ? 'always' : 'manual';
            fileContent = `---
cursorRuleType: ${ruleType}
---

${content}`;
          }
          break;

        case RuleFormat.CLAUDE_MEMORIES:
        case RuleFormat.GEMINI_MEMORIES:
          // Claude and Gemini memory files
          filename = `${ruleName || 'default'}${getFileExtension(format)}`;
          break;

        default:
          // Default handling for other directory-based formats
          filename = `${ruleName || 'default'}${getFileExtension(format)}`;
      }

      const filePath = join(outputPath, filename);

      // Check if file exists and force is not enabled
      if (existsSync(filePath) && !force) {
        throw new Error(`File ${filePath} already exists. Use --force to overwrite.`);
      }

      // Write content to file
      await writeFile(filePath, fileContent);
    } else if (hasRootFile(format)) {
      // Handle root file formats like CLAUDE.md or GEMINI.md
      const outputPath = join(outputDir, format);
      const outputDirPath = dirname(outputPath);

      // Check if file exists and force is not enabled
      if (existsSync(outputPath) && !force) {
        throw new Error(`File ${outputPath} already exists. Use --force to overwrite.`);
      }

      // Create directory if it doesn't exist
      await mkdir(outputDirPath, { recursive: true });

      // For Claude and Gemini root files, include @filename references if ruleName is provided
      let fileContent = content;
      if (ruleName && (format === RuleFormat.CLAUDE_ROOT || format === RuleFormat.GEMINI_ROOT)) {
        // Add reference to the memory file at the end
        fileContent += `\n\n@${ruleName}`;
      }

      // Write content to file
      await writeFile(outputPath, fileContent);
    } else {
      // Handle regular file-based formats
      const outputPath = join(outputDir, format);
      const outputDirPath = dirname(outputPath);

      // Check if file exists and force is not enabled
      if (existsSync(outputPath) && !force) {
        throw new Error(`File ${outputPath} already exists. Use --force to overwrite.`);
      }

      // Create directory if it doesn't exist
      await mkdir(outputDirPath, { recursive: true });

      // Write content to file
      await writeFile(outputPath, content);
    }
  } catch (error) {
    throw new Error(`Error writing rules to file: ${(error as Error).message}`);
  }
}

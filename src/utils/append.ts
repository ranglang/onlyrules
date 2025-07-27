import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { readRulesFromUrl, isUrl, readRulesFromInput } from './reader';

/**
 * Append new rules to the rulesync.mdc file with proper section separation
 * @param sourceFile Path to the source file containing new rules to append
 * @param targetFile Path to the target rulesync.mdc file (default: './rulesync.mdc')
 * @returns Promise<void>
 */
export async function appendRulesToFile(sourceFile: string, targetFile = './rulesync.mdc'): Promise<void> {
  try {
    // Read the new rules content from source
    const newRulesContent = await readRulesFromInput(sourceFile);
    
    if (!newRulesContent.trim()) {
      throw new Error('Source file is empty or contains no content');
    }

    let finalContent: string;
    
    // Check if target file exists
    if (existsSync(targetFile)) {
      // Read existing content
      const existingContent = await readFile(targetFile, 'utf-8');
      
      if (existingContent.trim()) {
        // Append with section separator that includes proper frontmatter
        // Generate a section name based on content frontmatter or fallback to source-based name
        const sectionName = generateSectionName(sourceFile, newRulesContent);
        const cleanExistingContent = existingContent.trimEnd();
        const frontmatter = `---
name: ${sectionName}
---`;
        finalContent = `${cleanExistingContent}

${frontmatter}

${newRulesContent.trim()}
`;
      } else {
        // Target file exists but is empty, just add new content
        finalContent = `${newRulesContent.trim()}\n`;
      }
    } else {
      // Target file doesn't exist, create it with new content
      finalContent = `${newRulesContent.trim()}\n`;
    }

    // Write the combined content to target file
    await writeFile(targetFile, finalContent);
    
    console.log(`Successfully appended rules from ${sourceFile} to ${targetFile}`);
  } catch (error) {
    throw new Error(`Error appending rules: ${(error as Error).message}`);
  }
}

/**
 * Extract section name from frontmatter if available
 * @param content The content to parse for frontmatter
 * @returns The name from frontmatter or null if not found
 */
function extractNameFromFrontmatter(content: string): string | null {
  // Look for frontmatter at the beginning of content
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatterContent = frontmatterMatch[1];
  // Look for name field in frontmatter
  const nameMatch = frontmatterContent.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  return null;
}

/**
 * Generate a meaningful section name based on content frontmatter or source file
 * @param sourceFile Path to the source file or URL
 * @param content The content to check for existing frontmatter name
 * @returns Generated section name
 */
function generateSectionName(sourceFile: string, content: string): string {
  // First, try to extract name from content's frontmatter
  const frontmatterName = extractNameFromFrontmatter(content);
  if (frontmatterName) {
    return frontmatterName;
  }

  // Fallback to generating name based on source file
  if (isUrl(sourceFile)) {
    // For URLs, extract domain or use a generic name with timestamp
    try {
      const url = new URL(sourceFile);
      const domain = url.hostname.replace(/^www\./, '');
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      return `${domain}-${timestamp}`;
    } catch {
      const timestamp = new Date().toISOString().slice(0, 10);
      return `remote-rules-${timestamp}`;
    }
  } else {
    // For local files, use filename without extension
    const filename = basename(sourceFile, '.mdc').replace(/\.(md|txt)$/, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${filename}-${timestamp}`;
  }
}

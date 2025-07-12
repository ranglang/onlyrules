import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { RuleTemplate } from '../types';

/**
 * Get available rule templates
 * @param templatesDir Directory containing templates
 * @returns Array of available templates
 */
export async function getAvailableTemplates(templatesDir: string): Promise<RuleTemplate[]> {
  try {
    const files = await readdir(templatesDir);
    const templateFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdc'));
    
    const templates: RuleTemplate[] = [];
    
    for (const file of templateFiles) {
      const content = await readFile(join(templatesDir, file), 'utf-8');
      const name = file.replace(/\.(md|mdc)$/, '');
      
      // Extract first line as title/description
      const firstLine = content.split('\n')[0].replace('# ', '');
      
      templates.push({
        name,
        description: firstLine,
        content
      });
    }
    
    return templates;
  } catch (error) {
    throw new Error(`Error reading templates: ${(error as Error).message}`);
  }
}

/**
 * Get a specific template by name
 * @param templatesDir Directory containing templates
 * @param templateName Name of the template to get
 * @returns Template content
 */
export async function getTemplateByName(templatesDir: string, templateName: string): Promise<RuleTemplate> {
  try {
    const templates = await getAvailableTemplates(templatesDir);
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    return template;
  } catch (error) {
    throw new Error(`Error getting template: ${(error as Error).message}`);
  }
}

/**
 * Parse rules from a file content
 * Supports both simple markdown files and concatenated rule templates
 * @param {string} content - File content
 * @param {string} filePath - Path to the file (used for naming)
 * @returns {Array<{name: string, content: string}>} - Array of rule objects
 */
export function parseRuleFile(content: string, filePath: string): Array<{name: string, content: string}> {
  const fileExt = filePath.split('.').pop()?.toLowerCase();
  const fileName = basename(filePath).split('.')[0];
  
  // If it's a simple markdown file (not .mdc), treat it as a single rule
  if (fileExt === 'md') {
    return [{
      name: fileName,
      content: content
    }];
  }
  
  // For .mdc files, parse as concatenated rules
  if (fileExt === 'mdc') {
    return parseMdcContent(content, fileName);
  }
  
  // Default to treating as a single rule if extension is unknown
  return [{
    name: fileName,
    content: content
  }];
}

/**
 * Extract title from markdown content
 * @param {string} content - Markdown content
 * @returns {string} - Extracted title or default description
 */
export function extractTitleFromMarkdown(content: string): string {
  // Try to find the first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // If no heading found, use the first non-empty line
  const firstLine = content.split('\n').find(line => line.trim().length > 0);
  if (firstLine) {
    return firstLine.trim();
  }
  
  return 'AI Rules';
}

/**
 * Parse MDC content with multiple rule sections
 * @param {string} content - MDC file content
 * @param {string} defaultName - Default name to use if no name is found
 * @returns {Array<{name: string, content: string}>} - Array of rule objects
 */
function parseMdcContent(content: string, defaultName: string): Array<{name: string, content: string}> {
  const rules: Array<{name: string, content: string}> = [];
  
  // Split the content by rule sections using regex
  const pattern = /---(([\s\S]*?)---(([\s\S]*?)(?=---|$)))/g;
  
  let match;
  let index = 0;
  while ((match = pattern.exec(content)) !== null) {
    const frontmatterText = match[2].trim();
    const contentText = match[3].trim();
    
    // Parse frontmatter into key-value pairs
    const frontmatterObj: Record<string, string> = {};
    frontmatterText.split('\n').forEach((line: string) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        frontmatterObj[key] = value;
      }
    });
    
    // Get rule name from frontmatter or generate one
    const name = frontmatterObj.name || `${defaultName}-${index + 1}`;
    
    // Add the rule to our collection
    rules.push({
      name,
      content: contentText
    });
    
    index++;
  }
  
  // If no rules found, treat the entire content as a single rule
  if (rules.length === 0) {
    return [{
      name: defaultName,
      content: content
    }];
  }
  
  return rules;
}

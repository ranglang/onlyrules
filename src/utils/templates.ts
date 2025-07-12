import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RuleTemplate } from '../types';

/**
 * Get available rule templates
 * @param templatesDir Directory containing templates
 * @returns Array of available templates
 */
export async function getAvailableTemplates(templatesDir: string): Promise<RuleTemplate[]> {
  try {
    const files = await readdir(templatesDir);
    const templateFiles = files.filter(file => file.endsWith('.md'));
    
    const templates: RuleTemplate[] = [];
    
    for (const file of templateFiles) {
      const content = await readFile(join(templatesDir, file), 'utf-8');
      const name = file.replace('.md', '');
      
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

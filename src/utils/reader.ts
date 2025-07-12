import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import fetch from 'node-fetch';
import { parseRuleFile } from './templates';

/**
 * Read rules content from a URL
 * @param url URL to fetch rules from
 * @returns Rules content as string
 */
export async function readRulesFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rules from URL: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Error fetching rules from URL: ${(error as Error).message}`);
  }
}

/**
 * Read rules content from a local file
 * @param filePath Path to the rules file
 * @returns Rules content as string
 */
export async function readRulesFromFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Error reading rules file: ${(error as Error).message}`);
  }
}

/**
 * Read Lingma project-specific rules from the .lingma/rules directory
 * @param projectPath Path to the project root
 * @returns Combined rules content as string
 */
export async function readLingmaProjectRules(projectPath: string): Promise<string> {
  const rulesDir = join(projectPath, '.lingma', 'rules');
  
  // Check if the rules directory exists
  if (!existsSync(rulesDir)) {
    throw new Error(`Lingma project rules directory not found: ${rulesDir}`);
  }
  
  try {
    // Read all rule files in the directory
    const files = await readdir(rulesDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      throw new Error('No rule files found in Lingma project rules directory');
    }
    
    // Read content from each file and combine them
    const contentPromises = mdFiles.map(async (file) => {
      const filePath = join(rulesDir, file);
      const content = await readFile(filePath, 'utf-8');
      return `# ${file}\n\n${content}`;
    });
    
    const contents = await Promise.all(contentPromises);
    return contents.join('\n\n---\n\n');
  } catch (error) {
    throw new Error(`Error reading Lingma project rules: ${(error as Error).message}`);
  }
}

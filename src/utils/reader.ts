import { readFile } from 'node:fs/promises';
import fetch from 'node-fetch';

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

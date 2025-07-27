import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface OnlyRulesConfig {
  target?: string[];
}

const CONFIG_FILE_NAME = 'onlyrules.json';

/**
 * Get the path to the onlyrules.json config file in the current working directory
 */
export function getConfigPath(): string {
  return join(process.cwd(), CONFIG_FILE_NAME);
}

/**
 * Check if onlyrules.json exists in the current directory
 */
export function configExists(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Read the onlyrules.json config file
 * Returns an empty config object if the file doesn't exist
 */
export async function readConfig(): Promise<OnlyRulesConfig> {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    return {};
  }
  
  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content) as OnlyRulesConfig;
  } catch (error) {
    // If parsing fails, return empty config
    console.warn(`Warning: Failed to parse ${CONFIG_FILE_NAME}, using empty config`);
    return {};
  }
}

/**
 * Write the onlyrules.json config file
 */
export async function writeConfig(config: OnlyRulesConfig): Promise<void> {
  const configPath = getConfigPath();
  const content = JSON.stringify(config, null, 2);
  await writeFile(configPath, content, 'utf-8');
}

/**
 * Update the target array in the config file
 * Creates the file if it doesn't exist, or merges with existing config
 */
export async function updateConfigTargets(targets: string[]): Promise<void> {
  const existingConfig = await readConfig();
  
  // Merge with existing config, updating only the target field
  const updatedConfig: OnlyRulesConfig = {
    ...existingConfig,
    target: targets
  };
  
  await writeConfig(updatedConfig);
}

/**
 * Get targets from config file, or return empty array if not configured
 */
export async function getConfigTargets(): Promise<string[]> {
  const config = await readConfig();
  return config.target || [];
}

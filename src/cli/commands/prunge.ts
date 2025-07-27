import { Command } from './base';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';

export class PrungeCommand implements Command {
  async execute(args: any): Promise<void> {
    const spinner = ora('Removing all IDE rules...').start();
    
    try {
      // Define paths to IDE rule directories/files to remove
      const idePaths = [
        './.cursorrules',
        './.cursor',
        './.github/copilot-instructions.md',
        './.github/instructions',
        './.clinerules',
        './.junie',
        './.windsurfrules',
        './.trae',
        './.augment',
        './.augment-guidelines',
        './.lingma/rules',
        './.gemini',
        './.claude',
        './.roo',
        './CLAUDE.md',
        './GEMINI.md',
        './AGENTS.md'
      ];
      
      // Import fs modules
      const { rm } = await import('fs/promises');
      
      // Track removed paths
      const removedPaths: string[] = [];
      
      // Remove each IDE path if it exists
      for (const path of idePaths) {
        try {
          if (existsSync(path)) {
            await rm(path, { recursive: true, force: true });
            removedPaths.push(path);
          }
        } catch (err) {
          console.warn(chalk.yellow(`Warning: Could not remove ${path}: ${(err as Error).message}`));
        }
      }
      
      if (removedPaths.length > 0) {
        spinner.succeed(`Successfully removed ${removedPaths.length} IDE rule paths`);
        console.log(chalk.green('The following paths were removed:'));
        removedPaths.forEach(path => {
          console.log(chalk.green(`- ${path}`));
        });
      } else {
        spinner.info('No IDE rules were found to remove');
      }
    } catch (error) {
      spinner.fail(`Failed to remove IDE rules: ${(error as Error).message}`);
      process.exit(1);
    }
  }
}

import { existsSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';
import { IDE_RULE_PATHS_FOR_REMOVAL } from '../../utils/ide-paths';
import { Command } from './base';

export class PrungeCommand implements Command {
  async execute(_args: unknown): Promise<void> {
    const spinner = ora('Removing all IDE rules...').start();

    try {
      // Use shared IDE paths for removal
      const idePaths = IDE_RULE_PATHS_FOR_REMOVAL;

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
          console.warn(
            chalk.yellow(`Warning: Could not remove ${path}: ${(err as Error).message}`)
          );
        }
      }

      if (removedPaths.length > 0) {
        spinner.succeed(`Successfully removed ${removedPaths.length} IDE rule paths`);
        console.log(chalk.green('The following paths were removed:'));
        for (const path of removedPaths) {
          console.log(chalk.green(`- ${path}`));
        }
      } else {
        spinner.info('No IDE rules were found to remove');
      }
    } catch (error) {
      spinner.fail(`Failed to remove IDE rules: ${(error as Error).message}`);
      process.exit(1);
    }
  }
}

import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { getTemplateByName } from '../../utils/templates';
import { Command } from './base';

export class TemplateCommand implements Command {
  async execute(args: { templateName: string }): Promise<void> {
    // Get templates directory path
    const templatesDir = path.join(__dirname, '..', '..', '..', 'templates');

    const spinner = ora(`Loading template '${args.templateName}'...`).start();

    try {
      const template = await getTemplateByName(templatesDir, args.templateName);
      spinner.succeed(`Template '${args.templateName}' loaded`);

      console.log(chalk.bold('\nTemplate content:'));
      console.log(template.content);

      console.log(
        chalk.blue('\nTo create a new rules file from this template: ') +
          chalk.green(`onlyrules init ${args.templateName}`)
      );
    } catch (error) {
      spinner.fail(`Failed to load template: ${(error as Error).message}`);
      process.exit(1);
    }
  }
}

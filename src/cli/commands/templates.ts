import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { getAvailableTemplates } from '../../utils/templates';
import { Command } from './base';

export class TemplatesCommand implements Command {
  async execute(_args: unknown): Promise<void> {
    // Get templates directory path
    const templatesDir = path.join(__dirname, '..', '..', '..', 'templates');

    const spinner = ora('Loading available templates...').start();

    try {
      const templates = await getAvailableTemplates(templatesDir);
      spinner.succeed(`Found ${templates.length} templates`);

      console.log(chalk.bold('\nAvailable templates:'));
      for (const [index, template] of templates.entries()) {
        console.log(`${chalk.green(`${index + 1}. ${template.name}`)} - ${template.description}`);
      }

      console.log(chalk.blue('\nTo view a template: onlyrules template <name>'));
      console.log(chalk.blue('To create a new rules file from a template: onlyrules init <name>'));
    } catch (error) {
      spinner.fail(`Failed to load templates: ${(error as Error).message}`);
      process.exit(1);
    }
  }
}

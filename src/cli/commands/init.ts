import { Command } from './base';
import { generateRules } from '../../core/generator';
import { getTemplateByName } from '../../utils/templates';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';

export class InitCommand implements Command {
  async execute(args: any): Promise<void> {
    // Get templates directory path
    const templatesDir = path.join(__dirname, '..', '..', '..', 'templates');
    
    // Use 'basic' as default template if no template name is provided
    if (!args.templateName) {
      args.templateName = 'basic';
    }
    
    // Set default output path if not provided
    const outputPath = args.output || './rulesync.mdc';
    const spinner = ora(`Creating new rules file from template '${args.templateName}'...`).start();
    
    try {
      // Get template content
      const template = await getTemplateByName(templatesDir, args.templateName);
      
      // Check if output file already exists
      let fileExists = false;
      try {
        const stat = await import('fs/promises').then(fs => fs.stat(outputPath));
        fileExists = stat.isFile();
        if (fileExists && !args.force) {
          spinner.fail(`File ${outputPath} already exists. Use --force to overwrite.`);
          process.exit(1);
        }
      } catch (err) {
        // File doesn't exist, which is what we want
      }
      
      // Create directory if it doesn't exist
      await mkdir(dirname(outputPath), { recursive: true });
      
      // Write template content to file
      await writeFile(outputPath, template.content);
      
      spinner.succeed(`Created new rules file at ${outputPath}`);
      
      // Automatically run generate command after creating the file
      spinner.text = 'Generating rule files from the newly created file...';
      spinner.start();
      
      try {
        await generateRules({
          file: outputPath,
          output: './',
          verbose: true,
          force: args.force
        });
        
        spinner.succeed('Rule files generated successfully');
        console.log(chalk.green('\nYou can edit ') + chalk.bold(outputPath) + chalk.green(' and then run ') + 
          chalk.bold('onlyrules generate -f ' + outputPath) + chalk.green(' to sync all rules.'));
      } catch (genError) {
        spinner.fail(`Failed to generate rule files: ${(genError as Error).message}`);
        console.log(chalk.yellow('\nYou can manually generate rules by running: ') + 
          chalk.bold(`onlyrules generate -f ${outputPath}`));
      }
    } catch (error) {
      spinner.fail(`Failed to create rules file: ${(error as Error).message}`);
      process.exit(1);
    }
  }
}

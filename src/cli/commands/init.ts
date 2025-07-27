import { Command } from './base';
import { getTemplateByName } from '../../utils/templates';
import { generateRules } from '../../core/generator';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { updateConfigTargets, getConfigTargets, configExists } from '../../utils/config';

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
      
      // Process target option if provided
      let targetArray: string[] | undefined;
      if (args.target) {
        const targets = args.target.split(',').map((t: string) => t.trim().toLowerCase());
        
        // Validate targets
        const { validateTargets } = await import('../../core/generator-v2');
        try {
          validateTargets(targets);
        } catch (error) {
          console.error(chalk.red(`Error: ${(error as Error).message}`));
          process.exit(1);
        }
        
        // Update onlyrules.json with the target preferences
        try {
          const configAction = configExists() ? 'Updated' : 'Created';
          await updateConfigTargets(targets);
          console.log(chalk.green(`${configAction} onlyrules.json with targets: ${targets.join(', ')}`));
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to update onlyrules.json: ${(error as Error).message}`));
        }
        
        console.log(chalk.blue(`Will generate rules for targets: ${targets.join(', ')}`));
        targetArray = targets;
      } else {
        // If no target specified, try to load from config
        try {
          const configTargets = await getConfigTargets();
          if (configTargets.length > 0) {
            targetArray = configTargets;
            console.log(chalk.blue(`Using targets from onlyrules.json: ${configTargets.join(', ')}`));
          }
        } catch (error) {
          // Silently ignore config reading errors
        }
      }
      
      // Automatically run generate command after creating the file
      spinner.text = 'Generating rule files from the newly created file...';
      spinner.start();
      
      try {
        await generateRules({
          file: outputPath,
          output: './',
          verbose: true,
          force: args.force,
          target: targetArray
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

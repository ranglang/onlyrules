#!/usr/bin/env node
import { parseArgs } from './cli/args';
import { generateRules } from './core/generator';
import { getAvailableTemplates, getTemplateByName } from './utils/templates';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';

// Get templates directory path
const templatesDir = path.join(__dirname, '..', 'templates');

async function main() {
  try {
    const rawArgs = process.argv.slice(2);
    
    // Handle empty arguments
    if (rawArgs.length === 0) {
      console.log(chalk.yellow('No arguments provided. Use --help for usage information.'));
      process.exit(1);
    }
    
    // Special handling for generate command
    if (rawArgs[0] === 'generate') {
      let url: string | undefined;
      let file: string | undefined;
      let output = './';
      let verbose = false;
      let force = false;
      
      // Parse command line arguments
      for (let i = 1; i < rawArgs.length; i++) {
        if ((rawArgs[i] === '-u' || rawArgs[i] === '--url') && i + 1 < rawArgs.length) {
          url = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if ((rawArgs[i] === '-f' || rawArgs[i] === '--file') && i + 1 < rawArgs.length) {
          file = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
          output = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if (rawArgs[i] === '-v' || rawArgs[i] === '--verbose') {
          verbose = true;
        } else if (rawArgs[i] === '--force') {
          force = true;
        }
      }
      
      // Validate arguments
      if (!url && !file) {
        console.error(chalk.red('Error: Either --url or --file must be provided'));
        console.log(chalk.yellow('Usage: onlyrules generate --url <url> | --file <path> [--output <dir>] [--verbose] [--force]'));
        process.exit(1);
      }
      
      if (url && file) {
        console.error(chalk.red('Error: Only one of --url or --file can be provided'));
        console.log(chalk.yellow('Usage: onlyrules generate --url <url> | --file <path> [--output <dir>] [--verbose] [--force]'));
        process.exit(1);
      }
      
      // Handle generate command directly
      await handleGenerateCommand({
        command: 'generate',
        url,
        file,
        output,
        verbose,
        force
      });
      return;
    }
    
    // Special handling for init command with output option
    if (rawArgs[0] === 'init') {
      if (rawArgs.length < 2) {
        console.error(chalk.red('Error: Template name is required for init command'));
        console.log(chalk.yellow('Usage: onlyrules init <template-name> [-o output-file] [--force]'));
        process.exit(1);
      }
      
      const templateName = rawArgs[1];
      let outputPath = './rulesync.md'; // Default
      let force = false;
      
      // Parse command line arguments
      for (let i = 2; i < rawArgs.length; i++) {
        if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
          outputPath = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if (rawArgs[i] === '--force') {
          force = true;
        }
      }
      
      // Handle init command directly
      await handleInitCommand({
        command: 'init',
        templateName,
        output: outputPath,
        force
      });
      return;
    }
    
    // Parse command line arguments for other commands
    const args = parseArgs(rawArgs);
    
    // Handle different commands
    switch (args.command) {
      case 'generate':
        await handleGenerateCommand(args);
        break;
      case 'templates':
        await handleTemplatesCommand();
        break;
      case 'template':
        await handleTemplateCommand(args);
        break;
      case 'init':
        await handleInitCommand(args);
        break;
      default:
        console.error(chalk.red('Unknown command'));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Handle the generate command
 */
async function handleGenerateCommand(args: any) {
  // Show source information
  if (args.url) {
    console.log(chalk.blue(`Fetching rules from URL: ${args.url}`));
  } else if (args.file) {
    console.log(chalk.blue(`Reading rules from file: ${args.file}`));
  }
  
  // Show spinner during generation
  const spinner = ora('Generating rule files...').start();
  
  try {
    // Generate rules
    await generateRules(args);
    spinner.succeed('Rule files generated successfully');
  } catch (error) {
    spinner.fail(`Failed to generate rule files: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle the templates command
 */
async function handleTemplatesCommand() {
  const spinner = ora('Loading available templates...').start();
  
  try {
    const templates = await getAvailableTemplates(templatesDir);
    spinner.succeed(`Found ${templates.length} templates`);
    
    console.log(chalk.bold('\nAvailable templates:'));
    templates.forEach((template, index) => {
      console.log(chalk.green(`${index + 1}. ${template.name}`) + ` - ${template.description}`);
    });
    
    console.log(chalk.blue('\nTo view a template: onlyrules template <name>'));
    console.log(chalk.blue('To create a new rules file from a template: onlyrules init <name>'));
  } catch (error) {
    spinner.fail(`Failed to load templates: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle the template command
 */
async function handleTemplateCommand(args: any) {
  const spinner = ora(`Loading template '${args.templateName}'...`).start();
  
  try {
    const template = await getTemplateByName(templatesDir, args.templateName);
    spinner.succeed(`Template '${args.templateName}' loaded`);
    
    console.log(chalk.bold('\nTemplate content:'));
    console.log(template.content);
    
    console.log(chalk.blue('\nTo create a new rules file from this template: ') + 
      chalk.green(`onlyrules init ${args.templateName}`));
  } catch (error) {
    spinner.fail(`Failed to load template: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle the init command
 */
async function handleInitCommand(args: any) {
  if (!args.templateName) {
    console.error(chalk.red('Error: Template name is required'));
    process.exit(1);
  }
  
  // Set default output path if not provided
  const outputPath = args.output || './rulesync.md';
  const spinner = ora(`Creating new rules file from template '${args.templateName}'...`).start();
  
  try {
    // Get template content
    const template = await getTemplateByName(templatesDir, args.templateName);
    
    // Check if output file already exists
    try {
      const stat = await import('fs/promises').then(fs => fs.stat(outputPath));
      if (stat.isFile() && !args.force) {
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
    console.log(chalk.blue('\nTo generate AI assistant rule files from this file: ') + 
      chalk.green(`onlyrules generate -f ${outputPath}`));
  } catch (error) {
    spinner.fail(`Failed to create rules file: ${(error as Error).message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red(`Unhandled error: ${error.message}`));
  process.exit(1);
});

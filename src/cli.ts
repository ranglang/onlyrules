#!/usr/bin/env node
import { parseArgs } from './cli/args';
import { generateRules } from './core/generator';
import { getAvailableTemplates, getTemplateByName } from './utils/templates';
import { writeFile, mkdir } from 'node:fs/promises';
import { updateAICoderulesSection } from './utils/file-utils';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { LingmaCliArgs } from './types';

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
      let file: string | undefined;
      let output = './';
      let verbose = false;
      let force = false;
      let ideStyle = true; // Default to IDE-style
      let ideFolder: string | undefined;
      let generateTraditional = false;
      
      // Parse command line arguments
      for (let i = 1; i < rawArgs.length; i++) {
        if ((rawArgs[i] === '-f' || rawArgs[i] === '--file') && i + 1 < rawArgs.length) {
          file = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
          output = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if ((rawArgs[i] === '--ide-folder') && i + 1 < rawArgs.length) {
          ideFolder = rawArgs[i + 1];
          i++; // Skip the next argument
        } else if (rawArgs[i] === '-v' || rawArgs[i] === '--verbose') {
          verbose = true;
        } else if (rawArgs[i] === '--force') {
          force = true;
        } else if (rawArgs[i] === '--no-ide-style') {
          ideStyle = false;
        } else if (rawArgs[i] === '--traditional') {
          generateTraditional = true;
        }
      }
      
      // If file is not provided, use rulesync.mdc as default
      if (!file) {
        file = './rulesync.mdc';
        // Check if rulesync.mdc exists
        if (!existsSync(file)) {
          console.log(chalk.yellow(`Default file 'rulesync.mdc' not found. You can create it with 'onlyrules init <template-name>'`));
          console.log(chalk.yellow('Usage: onlyrules generate --file <path_or_url> [--output <dir>] [--verbose] [--force] [--no-ide-style] [--ide-folder <name>] [--traditional]'));
          process.exit(1);
        }
      }
      
      // Handle generate command directly
      await handleGenerateCommand({
        command: 'generate',
        file,
        output,
        verbose,
        force,
        ideStyle,
        ideFolder,
        generateTraditional
      });
      return;
    }
    
    // Special handling for init command with output option
    if (rawArgs[0] === 'init') {
      // Use 'basic' as default template if no template name is provided
      let templateName = 'basic'; // Default to basic template
      let outputPath = './rulesync.mdc'; // Default output path
      let force = false;
      
      // If template name is provided, use it instead of the default
      if (rawArgs.length >= 2 && !rawArgs[1].startsWith('-')) {
        templateName = rawArgs[1];
      }
      
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
    
    // Special handling for gitignore command
    if (rawArgs[0] === 'gitignore') {
      await handleGitignoreCommand();
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
      case 'lingma':
        await handleLingmaCommand(args);
        break;
      case 'gitignore':
        await handleGitignoreCommand();
        break;
      case 'prunge':
        await handlePrungeCommand();
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
  // If file is not provided in args, use rulesync.mdc as default
  if (!args.file) {
    args.file = './rulesync.mdc';
    // Check if rulesync.mdc exists
    if (!existsSync(args.file)) {
      console.log(chalk.yellow(`Default file 'rulesync.mdc' not found. You can create it with 'onlyrules init <template-name>'`));
      console.log(chalk.yellow('Usage: onlyrules generate --file <path_or_url> [--output <dir>] [--verbose] [--force] [--no-ide-style] [--ide-folder <name>] [--traditional]'));
      process.exit(1);
    }
  }
  
  // Import the URL detection function
  const { isUrl } = await import('./utils/reader');
  
  // Show source information
  if (isUrl(args.file)) {
    console.log(chalk.blue(`Fetching rules from URL: ${args.file}`));
  } else {
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

/**
 * Handle the lingma command for Lingma project-specific rules
 */
async function handleLingmaCommand(args: LingmaCliArgs): Promise<void> {
  const { action, ruleName, output, force } = args;
  
  // Get current working directory as project path
  const projectPath = process.cwd();
  
  // Create the .lingma/rules directory if it doesn't exist
  const rulesDir = join(projectPath, '.lingma', 'rules');
  
  if (action === 'init') {
    const spinner = ora('Initializing Lingma project rules...').start();
    
    try {
      // Create the rules directory
      await mkdir(rulesDir, { recursive: true });
      
      // Create a default rule file if ruleName is not provided
      const ruleFileName = ruleName ? `${ruleName}.md` : 'default.md';
      const rulePath = join(rulesDir, ruleFileName);
      
      // Check if file already exists
      if (existsSync(rulePath) && !force) {
        spinner.fail(`Rule file ${ruleFileName} already exists. Use --force to overwrite.`);
        process.exit(1);
      }
      
      // Create a template rule file
      const templateContent = `# ${ruleName || 'Default'} Project Rules

## Project Preferences
- Add your project preferences here

## Coding Style
- Add your coding style preferences here

## Framework Guidelines
- Add your framework-specific guidelines here
`;
      
      await writeFile(rulePath, templateContent);
      
      spinner.succeed(`Lingma project rule file created at ${rulePath}`);
      console.log(chalk.blue('\nEdit this file to add your project-specific rules.'));
    } catch (error) {
      spinner.fail(`Failed to initialize Lingma project rules: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (action === 'generate') {
    const spinner = ora('Generating rules from Lingma project rules...').start();
    
    try {
      // Check if the rules directory exists
      if (!existsSync(rulesDir)) {
        spinner.fail(`Lingma project rules directory not found: ${rulesDir}`);
        console.log(chalk.yellow('\nUse \'onlyrules lingma init\' to create a new Lingma project rules directory.'));
        process.exit(1);
      }
      
      // Import the readLingmaProjectRules function
      const { readLingmaProjectRules } = await import('./utils/reader');
      
      // Read all rule files in the directory and combine them
      const rulesContent = await readLingmaProjectRules(projectPath);
      
      // Generate rules for other formats
      await generateRules({
        output: output || './',
        file: undefined,
        force: force || false,
        verbose: true,
        // Use the combined rules content directly
        rulesContent
      });
      
      spinner.succeed('Rules generated from Lingma project rules');
    } catch (error) {
      spinner.fail(`Failed to generate rules from Lingma project rules: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    console.error(chalk.red(`Unknown Lingma action: ${action}`));
    console.log(chalk.yellow('Available actions: init, generate'));
    process.exit(1);
  }
}

/**
 * Handle the gitignore command
 * Creates or updates a .gitignore file to ignore all AI Coderules except rulessync.md
 */
async function handleGitignoreCommand(): Promise<void> {
  const gitignorePath = './.gitignore';
  const spinner = ora('Creating/updating .gitignore file...').start();
  
  try {
    // Read existing .gitignore content if it exists
    let existingContent = '';
    try {
      existingContent = await import('fs/promises').then(fs => fs.readFile(gitignorePath, 'utf8'));
    } catch (err) {
      // File doesn't exist yet, which is fine
    }
    
    // Define all AI rule paths to ignore
    const aiRulePaths = [
      '.cursorrules',
      '.cursor',
      'CLAUDE.md',
      '.claude',
      '.github/copilot-instructions.md',
      'GEMINI.md',
      '.gemini',
      'AGENTS.md',
      '.clinerules',
      '.junie',
      '.windsurfrules',
      '.trae',
      '.github/instructions',
      '.augment-guidelines',
      '.augment/rules',
      '.lingma/rules',
      '.roo',
      '.rules'
    ];
    
    // Create the AI rules ignore section with both files and directories
    let aiRulesSection = `
# AI Coderules (managed by onlyrules)
`;
    
    // Add each path to the section
    aiRulePaths.forEach(path => {
      aiRulesSection += `${path}${path.endsWith('/') ? '' : '\n'}`;
    });
    
    // Remove any existing AI Coderules sections
    // This handles multiple occurrences of the section header
    let updatedContent = existingContent;
    
    updatedContent = updateAICoderulesSection(existingContent, aiRulesSection);
    
    // Write the updated content back to the file
    await writeFile(gitignorePath, updatedContent);
    
    spinner.succeed('.gitignore file updated successfully');
    console.log(chalk.green('All AI Coderules are now ignored except for rulessync.md'));
  } catch (error) {
    spinner.fail(`Failed to update .gitignore file: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle the prunge command
 * Removes all IDE rules from the project
 */
async function handlePrungeCommand(): Promise<void> {
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

main().catch((error) => {
  console.error(chalk.red(`Unhandled error: ${error.message}`));
  process.exit(1);
});

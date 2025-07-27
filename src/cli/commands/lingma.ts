import { Command } from './base';
import { generateRules } from '../../core/generator';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';
import { LingmaCliArgs } from '../../types';

export class LingmaCommand implements Command {
  async execute(args: LingmaCliArgs): Promise<void> {
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
        const { readLingmaProjectRules } = await import('../../utils/reader');
        
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
}

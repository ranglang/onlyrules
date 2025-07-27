import { Command } from './base';
import { generateRules } from '../../core/generator';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';
import { updateConfigTargets, getConfigTargets, configExists } from '../../utils/config';

export class GenerateCommand implements Command {
  async execute(args: any): Promise<void> {
    // Import the URL detection and reading functions
    const { isUrl, readRulesFromUrl } = await import('../../utils/reader');
    
    // If file is not provided, use rulesync.mdc as default
    if (!args.file) {
      args.file = './rulesync.mdc';
      // Check if rulesync.mdc exists
      if (!existsSync(args.file)) {
        console.log(chalk.yellow(`Default file 'rulesync.mdc' not found. You can create it with 'onlyrules init <template-name>'`));
        console.log(chalk.yellow('Usage: onlyrules generate --file <path_or_url> [--output <dir>] [--verbose] [--force] [--no-ide-style] [--ide-folder <name>] [--traditional]'));
        process.exit(1);
      }
    }
    
    // If file is provided and it's a URL, download it to rulesync.mdc first
    if (args.file && isUrl(args.file)) {
      console.log(chalk.blue(`Fetching rules from URL: ${args.file}`));
      
      const downloadSpinner = ora('Downloading remote file to rulesync.mdc...').start();
      
      try {
        // Download the remote content
        const remoteContent = await readRulesFromUrl(args.file);
        
        // Write to rulesync.mdc
        await writeFile('./rulesync.mdc', remoteContent, 'utf-8');
        
        downloadSpinner.succeed('Remote file downloaded to rulesync.mdc');
        
        // Update args to use rulesync.mdc as the source
        args.file = './rulesync.mdc';
        
      } catch (error) {
        downloadSpinner.fail(`Failed to download remote file: ${(error as Error).message}`);
        process.exit(1);
      }
    }
    
    // Show source information
    console.log(chalk.blue(`Reading rules from file: ${args.file}`));
    
    // Process target option if provided
    if (args.target) {
      const targetArray = args.target.split(',').map((t: string) => t.trim().toLowerCase());
      args.target = targetArray;
      
      // Update onlyrules.json with the target preferences
      try {
        const configAction = configExists() ? 'Updated' : 'Created';
        await updateConfigTargets(targetArray);
        console.log(chalk.green(`${configAction} onlyrules.json with targets: ${targetArray.join(', ')}`));
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to update onlyrules.json: ${(error as Error).message}`));
      }
      
      console.log(chalk.blue(`Generating rules for targets: ${targetArray.join(', ')}`));
    } else {
      // If no target specified, try to load from config
      try {
        const configTargets = await getConfigTargets();
        if (configTargets.length > 0) {
          args.target = configTargets;
          console.log(chalk.blue(`Using targets from onlyrules.json: ${configTargets.join(', ')}`));
        }
      } catch (error) {
        // Silently ignore config reading errors
      }
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
}

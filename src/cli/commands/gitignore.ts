import { Command } from './base';
import { updateAICoderulesSection } from '../../utils/file-utils';
import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { IDE_RULE_PATHS_FOR_GITIGNORE } from '../../utils/ide-paths';

export class GitignoreCommand implements Command {
  async execute(args: any): Promise<void> {
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
      
      // Use shared AI rule paths for gitignore
      const aiRulePaths = IDE_RULE_PATHS_FOR_GITIGNORE;
      
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
}

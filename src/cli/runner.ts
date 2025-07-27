import chalk from 'chalk';
import { parseArgs } from './args';
import {
  Command,
  GenerateCommand,
  InitCommand,
  TemplatesCommand,
  TemplateCommand,
  AddCommand,
  GitignoreCommand,
  PrungeCommand
} from './commands';

export class CLIRunner {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    this.commands.set('generate', new GenerateCommand());
    this.commands.set('init', new InitCommand());
    this.commands.set('templates', new TemplatesCommand());
    this.commands.set('template', new TemplateCommand());
    this.commands.set('add', new AddCommand());
    this.commands.set('append', new AddCommand());

    this.commands.set('gitignore', new GitignoreCommand());
    this.commands.set('prunge', new PrungeCommand());
  }

  async run(rawArgs: string[]): Promise<void> {
    try {
      // Handle empty arguments
      if (rawArgs.length === 0) {
        console.log(chalk.yellow('No arguments provided. Use --help for usage information.'));
        process.exit(1);
      }

      const commandName = rawArgs[0];
      const command = this.commands.get(commandName);

      if (!command) {
        console.error(chalk.red(`Unknown command: ${commandName}`));
        process.exit(1);
      }

      // Special handling for generate and init commands that have custom parsing
      if (commandName === 'generate') {
        const args = this.parseGenerateArgs(rawArgs);
        await command.execute(args);
      } else if (commandName === 'init') {
        const args = this.parseInitArgs(rawArgs);
        await command.execute(args);
      } else if (commandName === 'add') {
        const args = this.parseAddArgs(rawArgs);
        await command.execute(args);
      } else if (commandName === 'append') {
        const args = this.parseAddArgs(rawArgs);
        await command.execute(args);
      } else if (commandName === 'gitignore' || commandName === 'prunge') {
        // These commands don't need arguments
        await command.execute({});
      } else {
        // Use standard argument parsing for other commands
        const args = parseArgs(rawArgs);
        await command.execute(args);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  private parseGenerateArgs(rawArgs: string[]): any {
    let file: string | undefined;
    let output = './';
    let verbose = false;
    let force = false;
    let ideStyle = true;
    let ideFolder: string | undefined;
    let generateTraditional = false;
    let target: string | undefined;

    // Parse command line arguments
    for (let i = 1; i < rawArgs.length; i++) {
      if ((rawArgs[i] === '-f' || rawArgs[i] === '--file') && i + 1 < rawArgs.length) {
        file = rawArgs[i + 1];
        i++;
      } else if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
        output = rawArgs[i + 1];
        i++;
      } else if ((rawArgs[i] === '--ide-folder') && i + 1 < rawArgs.length) {
        ideFolder = rawArgs[i + 1];
        i++;
      } else if ((rawArgs[i] === '--target') && i + 1 < rawArgs.length) {
        target = rawArgs[i + 1];
        i++;
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

    return {
      command: 'generate',
      file,
      output,
      verbose,
      force,
      ideStyle,
      ideFolder,
      generateTraditional,
      target
    };
  }

  private parseInitArgs(rawArgs: string[]): any {
    let templateName = 'basic';
    let outputPath = './rulesync.mdc';
    let force = false;

    // If template name is provided, use it instead of the default
    if (rawArgs.length >= 2 && !rawArgs[1].startsWith('-')) {
      templateName = rawArgs[1];
    }

    // Parse command line arguments
    for (let i = 2; i < rawArgs.length; i++) {
      if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
        outputPath = rawArgs[i + 1];
        i++;
      } else if (rawArgs[i] === '--force') {
        force = true;
      }
    }

    return {
      command: 'init',
      templateName,
      output: outputPath,
      force
    };
  }

  private parseAddArgs(rawArgs: string[]): any {
    let file: string | undefined;
    let output: string | undefined;

    // Parse command line arguments
    for (let i = 1; i < rawArgs.length; i++) {
      if ((rawArgs[i] === '-f' || rawArgs[i] === '--file') && i + 1 < rawArgs.length) {
        file = rawArgs[i + 1];
        i++;
      } else if ((rawArgs[i] === '-o' || rawArgs[i] === '--output') && i + 1 < rawArgs.length) {
        output = rawArgs[i + 1];
        i++;
      }
    }

    return {
      command: 'add',
      file,
      output
    };
  }
}

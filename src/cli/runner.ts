import chalk from 'chalk';
import {
  AddCommand,
  Command,
  GenerateCommand,
  GitignoreCommand,
  InitCommand,
  PrungeCommand,
  TemplateCommand,
  TemplatesCommand,
} from './commands';
import { AddArgs, GenerateArgs, InitArgs } from './commands/types';

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
      } else if (commandName === 'add' || commandName === 'append') {
        const args = this.parseAddArgs(rawArgs);
        await command.execute(args);
      } else if (commandName === 'gitignore' || commandName === 'prunge') {
        // These commands don't need arguments
        await command.execute({});
      } else {
        // Use standard argument parsing for other commands
        const { parseArgs } = await import('./args');
        const args = parseArgs(rawArgs);
        await command.execute(args);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  private parseGenerateArgs(rawArgs: string[]): GenerateArgs {
    const args: GenerateArgs = {
      command: 'generate',
      output: './',
      verbose: false,
      force: false,
      ideStyle: true,
      generateTraditional: false,
    };

    // Parse command line arguments
    for (let i = 1; i < rawArgs.length; i++) {
      const currentArg = rawArgs[i];
      const nextArg = rawArgs[i + 1];

      if ((currentArg === '-f' || currentArg === '--file') && nextArg) {
        args.file = nextArg;
        i++;
      } else if ((currentArg === '-o' || currentArg === '--output') && nextArg) {
        args.output = nextArg;
        i++;
      } else if (currentArg === '--ide-folder' && nextArg) {
        args.ideFolder = nextArg;
        i++;
      } else if (currentArg === '--target' && nextArg) {
        args.target = nextArg;
        i++;
      } else if (currentArg === '-v' || currentArg === '--verbose') {
        args.verbose = true;
      } else if (currentArg === '--force') {
        args.force = true;
      } else if (currentArg === '--no-ide-style') {
        args.ideStyle = false;
      } else if (currentArg === '--traditional') {
        args.generateTraditional = true;
      }
    }

    return args;
  }

  private parseInitArgs(rawArgs: string[]): InitArgs {
    const args: InitArgs = {
      command: 'init',
      templateName: 'basic',
      output: './rulesync.mdc',
      force: false,
    };

    // If template name is provided, use it instead of the default
    if (rawArgs.length >= 2 && !rawArgs[1].startsWith('-')) {
      args.templateName = rawArgs[1];
    }

    // Parse command line arguments
    for (let i = 2; i < rawArgs.length; i++) {
      const currentArg = rawArgs[i];
      const nextArg = rawArgs[i + 1];

      if ((currentArg === '-o' || currentArg === '--output') && nextArg) {
        args.output = nextArg;
        i++;
      } else if (currentArg === '--force') {
        args.force = true;
      } else if ((currentArg === '-t' || currentArg === '--target') && nextArg) {
        args.target = nextArg;
        i++;
      }
    }

    return args;
  }

  private parseAddArgs(rawArgs: string[]): AddArgs {
    const args: AddArgs = {
      command: 'add',
    };

    // Parse command line arguments
    for (let i = 1; i < rawArgs.length; i++) {
      const currentArg = rawArgs[i];
      const nextArg = rawArgs[i + 1];

      if ((currentArg === '-f' || currentArg === '--file') && nextArg) {
        args.file = nextArg;
        i++;
      } else if ((currentArg === '-o' || currentArg === '--output') && nextArg) {
        args.output = nextArg;
        i++;
      }
    }

    return args;
  }
}

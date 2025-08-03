import { appendRulesToFile } from '../../utils/append';
import { Command } from './base';

export interface AddCliArgs {
  command: 'add';
  file?: string;
  output?: string;
}

export class AddCommand implements Command {
  async execute(args: AddCliArgs): Promise<void> {
    if (!args.file) {
      throw new Error('File path is required. Use -f or --file to specify the source file.');
    }

    const targetFile = args.output || './rulesync.mdc';

    try {
      await appendRulesToFile(args.file, targetFile);
    } catch (error) {
      throw new Error(`Failed to append rules: ${(error as Error).message}`);
    }
  }
}

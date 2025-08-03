export interface GenerateArgs {
  command: 'generate';
  file?: string;
  output: string;
  verbose: boolean;
  force: boolean;
  ideStyle: boolean;
  ideFolder?: string;
  generateTraditional: boolean;
  target?: string;
}

export interface InitArgs {
  command: 'init';
  templateName: string;
  output: string;
  force: boolean;
  target?: string;
}

export interface AddArgs {
  command: 'add';
  file?: string;
  output?: string;
}

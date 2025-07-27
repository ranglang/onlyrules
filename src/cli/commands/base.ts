export interface Command {
  execute(args: any): Promise<void>;
}

export interface Command {
  execute(args: unknown): Promise<void>;
}

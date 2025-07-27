#!/usr/bin/env node
import { CLIRunner } from './runner';

async function main() {
  const rawArgs = process.argv.slice(2);
  const runner = new CLIRunner();
  await runner.run(rawArgs);
}

main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

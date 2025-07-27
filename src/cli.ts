#!/usr/bin/env node

// Import and execute the CLI runner
import('./cli/index').catch((error) => {
  console.error(`Failed to start CLI: ${error.message}`);
  process.exit(1);
});

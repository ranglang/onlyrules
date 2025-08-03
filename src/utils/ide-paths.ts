/**
 * Shared utility for IDE/AI rule paths used across commands
 */

import { DefaultRuleFormatterFactory } from '../core/factory';

/**
 * Get base IDE/AI rule paths dynamically from formatters
 * This ensures paths are always in sync with the actual formatters
 */
function getBaseIdePaths(): string[] {
  const factory = new DefaultRuleFormatterFactory();
  const formatters = factory.getAvailableFormatters();

  const paths = new Set<string>();

  // Extract defaultPath from each formatter
  for (const formatter of formatters.values()) {
    const defaultPath = formatter.spec.defaultPath;

    // Add the default path
    paths.add(defaultPath);

    // Add some legacy/alternative paths that might exist in projects
    // Based on actual formatter paths found:
    // .cursor/rules, .github/instructions, .clinerules, .junie/guidelines.md,
    // .trae/rules.md, .augment-guidelines, .lingma/rules, .gemini/memories,
    // .claude/memories, .windsurfrules, .kiro/steering, .roo/rules, .codebuddy/rules,
    // CLAUDE.md, GEMINI.md, AGENTS.md, .augment/rules/always.md

    // Add common legacy variations that users might have
    if (defaultPath === '.cursor/rules') {
      paths.add('.cursorrules'); // Legacy cursor format
      paths.add('.cursor'); // Legacy cursor directory
    }
    if (defaultPath === '.github/instructions') {
      paths.add('.github/copilot-instructions.md'); // Alternative copilot format
    }
    if (defaultPath === '.junie/guidelines.md') {
      paths.add('.junie'); // Legacy junie format (directory)
    }
    if (defaultPath === '.trae/rules.md') {
      paths.add('.trae'); // Legacy trae format (directory)
    }
    if (defaultPath === '.augment-guidelines') {
      paths.add('.augment'); // Alternative augment format
    }
    if (defaultPath === '.gemini/memories') {
      paths.add('.gemini'); // Legacy gemini format (directory)
    }
    if (defaultPath === '.claude/memories') {
      paths.add('.claude'); // Legacy claude format (directory)
    }
    if (defaultPath === '.roo/rules') {
      paths.add('.roo'); // Legacy roo format (directory)
    }
  }

  // Add some additional common paths that might not be covered by formatters
  paths.add('.rules'); // Generic rules directory

  return Array.from(paths).sort();
}

/**
 * Base IDE/AI rule paths without path prefixes
 * Dynamically generated from formatter specifications
 */
const BASE_IDE_RULE_PATHS = getBaseIdePaths();

/**
 * Common IDE/AI rule paths for removal operations (prunge command)
 * These paths include leading ./ for file operations
 */
export const IDE_RULE_PATHS_FOR_REMOVAL = BASE_IDE_RULE_PATHS.map((path) => `./${path}`);

/**
 * IDE/AI rule paths for gitignore patterns
 * These paths are relative without leading ./ for gitignore format
 */
export const IDE_RULE_PATHS_FOR_GITIGNORE = [...BASE_IDE_RULE_PATHS];

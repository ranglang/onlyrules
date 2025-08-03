/**
 * Utilities for getting supported AI assistants/IDE targets and formatters
 * This module provides public API access to supported targets for npm consumers
 */

import { DefaultRuleFormatterFactory } from '../core/factory';
import type { BaseRuleFormatter, RuleFormatSpec } from '../core/interfaces';

/**
 * Get all supported target names (AI assistants/IDEs)
 * These are the target names that can be used with the --target option
 */
export function getSupportedTargets(): string[] {
  return [
    // Modern formatters
    'cursor',
    'copilot',
    'cline',
    'claude',
    'claude-root',
    'claude-memories',
    'gemini',
    'gemini-root',
    'gemini-memories',
    'roo',
    'kiro',
    'codebuddy',
    'augmentcode',
    // Legacy formatters
    'agents',
    'junie',
    'windsurf',
    'trae',
    'lingma',
    'lingma-project',
  ];
}

/**
 * Get all available formatters with their specifications
 * Returns detailed information about each supported formatter
 */
export function getSupportedFormatters(): RuleFormatSpec[] {
  const factory = new DefaultRuleFormatterFactory();
  const formatters = factory.getAvailableFormatters();

  return Array.from(formatters.values()).map((formatter) => formatter.spec);
}

/**
 * Get formatter specifications grouped by category
 */
export function getFormattersByCategory(): Record<string, RuleFormatSpec[]> {
  const formatters = getSupportedFormatters();
  const grouped: Record<string, RuleFormatSpec[]> = {};

  for (const formatter of formatters) {
    const category = formatter.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(formatter);
  }

  return grouped;
}

/**
 * Check if a target name is supported
 */
export function isTargetSupported(target: string): boolean {
  const supportedTargets = getSupportedTargets();
  return supportedTargets.includes(target.toLowerCase());
}

/**
 * Get recommended formatters for common use cases
 */
export function getRecommendedTargets(): string[] {
  return ['cursor', 'copilot', 'cline', 'claude', 'gemini'];
}

/**
 * Get legacy target mappings for backward compatibility
 */
export function getLegacyTargetMappings(): Record<string, string> {
  return {
    // Legacy mappings
    agents: 'agents',
    junie: 'junie',
    windsurf: 'windsurf',
    trae: 'trae',
    augment: 'augmentcode',
    'augment-always': 'augmentcode',
    lingma: 'lingma',
    'lingma-project': 'lingma-project',
  };
}

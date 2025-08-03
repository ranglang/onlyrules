// Ensure enum is properly available at runtime
export const ONLEYRULES_ALL_TARGETS = {
  CURSOR: 'cursor',
  COPILOT: 'copilot',
  CLINE: 'cline',
  CLAUDE: 'claude',
  CLAUDE_ROOT: 'claude-root',
  CLAUDE_MEMORIES: 'claude-memories',
  GEMINI: 'gemini',
  GEMINI_ROOT: 'gemini-root',
  GEMINI_MEMORIES: 'gemini-memories',
  ROO: 'roo',
  KIRO: 'kiro',
  CODEBUDDY: 'codebuddy',
  AUGMENTCODE: 'augmentcode',
  // Legacy formatters
  AGENTS: 'agents',
  JUNIE: 'junie',
  WINDSURF: 'windsurf',
  TRAE: 'trae',
  LINGMA: 'lingma',
  LINGMA_PROJECT: 'lingma-project',
} as const;

// Type definition for the const object to maintain enum-like behavior
export type ONLEYRULES_ALL_TARGETS_TYPE =
  (typeof ONLEYRULES_ALL_TARGETS)[keyof typeof ONLEYRULES_ALL_TARGETS];

export type ONLEYRULESTYPE = 'cursor' | 'copilot' | 'cline' | 'claude' | 'gemini';

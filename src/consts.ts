
export enum ONLEYRULES_ALL_TARGETS {
  CURSOR = 'cursor',
  COPILOT = 'copilot',
  CLINE = 'cline',
  CLAUDE = 'claude',
  CLAUDE_ROOT = 'claude-root',
  CLAUDE_MEMORIES = 'claude-memories',
  GEMINI = 'gemini',
  GEMINI_ROOT = 'gemini-root',
  GEMINI_MEMORIES = 'gemini-memories',
  ROO = 'roo',
  KIRO = 'kiro',
  CODEBUDDY = 'codebuddy',
  AUGMENTCODE = 'augmentcode',
  // Legacy formatters
  AGENTS = 'agents',
  JUNIE = 'junie',
  WINDSURF = 'windsurf',
  TRAE = 'trae',
  LINGMA = 'lingma',
  LINGMA_PROJECT = 'lingma-project',
}

export type ONLEYRULESTYPE = 'cursor' | 'copilot' | 'cline' | 'claude' | 'gemini'

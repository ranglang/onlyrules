import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/utils/reader', () => ({
  readRulesFromUrl: vi.fn(),
  readRulesFromFile: vi.fn()
}));

vi.mock('../src/utils/writer', () => ({
  writeRulesToFile: vi.fn()
}));

import { generateRules } from '../src/core/generator';
import { readRulesFromUrl, readRulesFromFile } from '../src/utils/reader';
import { writeRulesToFile } from '../src/utils/writer';
import { RuleFormat } from '../src/types';

describe('Rules Generator', () => {
  const mockRules = '---\nname: test-rule\n---\n# Test Rule\nThis is a test rule.';
  
  beforeEach(() => {
        vi.clearAllMocks();
    process.env.ONLYRULES_USE_LEGACY = 'true';
  });

  it('should generate rules from URL', async () => {
    // Setup
    const url = 'http://example.com/rules.md';
    const output = './output';
    (readRulesFromUrl as any).mockResolvedValue(mockRules);
    
    // Execute
    await generateRules({ url, output });
    
    // Verify
    expect(readRulesFromUrl).toHaveBeenCalledWith(url);
    expect(writeRulesToFile).toHaveBeenCalledTimes(Object.keys(RuleFormat).length);
  });

  it('should generate rules from file', async () => {
    // Setup
    const file = './rules.md';
    const output = './output';
    (readRulesFromFile as any).mockResolvedValue(mockRules);
    
    // Execute
    await generateRules({ file, output });
    
    // Verify
    expect(readRulesFromFile).toHaveBeenCalledWith(file);
    expect(writeRulesToFile).toHaveBeenCalledTimes(Object.keys(RuleFormat).length);
  });

  it('should use default file if neither url nor file is provided', async () => {
    // Setup
    const output = './output';
    
    // Execute
    await generateRules({ output });
    
    // Verify - should use the default file path
    expect(readRulesFromFile).toHaveBeenCalledWith('./rulesync.mdc');
  });

  it('should handle empty rules content', async () => {
    // Setup
    const file = './empty-rules.md';
    const output = './output';
    (readRulesFromFile as any).mockResolvedValue('');
    
    // Execute & Verify
    await expect(generateRules({ file, output })).rejects.toThrow();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRules } from '../src/core/generator';
import { readRulesFromUrl, readRulesFromFile } from '../src/utils/reader';
import { writeRulesToFile } from '../src/utils/writer';
import { RuleFormat } from '../src/types';

// Mock dependencies
vi.mock('../src/utils/reader', () => ({
  readRulesFromUrl: vi.fn(),
  readRulesFromFile: vi.fn()
}));

vi.mock('../src/utils/writer', () => ({
  writeRulesToFile: vi.fn()
}));

describe('Rules Generator', () => {
  const mockRules = '# AI Rules\n\nFollow these rules when generating content.';
  
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should throw error if neither url nor file is provided', async () => {
    await expect(generateRules({ output: './' })).rejects.toThrow();
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

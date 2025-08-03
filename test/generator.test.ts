import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/utils/reader', () => ({
  readRulesFromInput: vi.fn(),
}));

vi.mock('../src/utils/writer', () => ({
  writeRulesToFile: vi.fn(),
}));

import { generateRules } from '../src/core/generator';
import { RuleFormat } from '../src/types';
import { readRulesFromInput } from '../src/utils/reader';
import { writeRulesToFile } from '../src/utils/writer';

describe('Rules Generator', () => {
  const mockRules = '---\nname: test-rule\n---\n# Test Rule\nThis is a test rule.';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ONLYRULES_USE_LEGACY = 'true';
  });

  it('should generate rules from URL via file parameter', async () => {
    // Setup
    const file = 'https://example.com/rules.md';
    const output = './output';
    (readRulesFromInput as any).mockResolvedValue(mockRules);

    // Execute
    await generateRules({ file, output });

    // Verify
    expect(readRulesFromInput).toHaveBeenCalledWith(file);
    expect(writeRulesToFile).toHaveBeenCalledTimes(Object.keys(RuleFormat).length);
  });

  it('should generate rules from local file', async () => {
    // Setup
    const file = './rules.md';
    const output = './output';
    (readRulesFromInput as any).mockResolvedValue(mockRules);

    // Execute
    await generateRules({ file, output });

    // Verify
    expect(readRulesFromInput).toHaveBeenCalledWith(file);
    expect(writeRulesToFile).toHaveBeenCalledTimes(Object.keys(RuleFormat).length);
  });

  it('should use default file if file is not provided', async () => {
    // Setup
    const output = './output';
    (readRulesFromInput as any).mockResolvedValue(mockRules);

    // Execute
    await generateRules({ output });

    // Verify - should use the default file path
    expect(readRulesFromInput).toHaveBeenCalledWith('./rulesync.mdc');
  });

  it('should handle empty rules content', async () => {
    // Setup
    const file = './empty-rules.md';
    const output = './output';
    (readRulesFromInput as any).mockResolvedValue('');

    // Execute & Verify
    await expect(generateRules({ file, output })).rejects.toThrow();
  });
});

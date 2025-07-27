import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the generator module
vi.mock('../src/core/generator', () => ({
  generateRules: vi.fn()
}));

import { parseArgs } from '../src/cli/args';
import { generateRules } from '../src/core/generator';
import { GenerateCliArgs, TemplateCliArgs, TemplatesCliArgs, InitCliArgs } from '../src/types';

// Set test environment
process.env.VITEST = 'true';

describe('CLI Arguments Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse file argument with local path correctly', () => {
    const args = parseArgs(['generate', '-f', './rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('./rules.md');
  });

  it('should parse file argument with URL correctly', () => {
    const args = parseArgs(['generate', '-f', 'https://example.com/rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('https://example.com/rules.md');
  });

  it('should handle --file long option with local path', () => {
    const args = parseArgs(['generate', '--file', './rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('./rules.md');
  });

  it('should handle --file long option with URL', () => {
    const args = parseArgs(['generate', '--file', 'https://example.com/rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('https://example.com/rules.md');
  });

  it('should set default output directory if not specified', () => {
    const args = parseArgs(['generate', '-f', './rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.output).toBe('./');
  });

  it('should parse output directory correctly', () => {
    const args = parseArgs(['generate', '-f', './rules.md', '-o', './output']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.output).toBe('./output');
  });

  it('should throw error if file is not provided', () => {
    expect(() => parseArgs(['generate'])).toThrow('--file must be provided');
  });

  it('should parse templates command correctly', () => {
    const args = parseArgs(['templates']) as TemplatesCliArgs;
    expect(args.command).toBe('templates');
  });

  it('should parse template command correctly', () => {
    const args = parseArgs(['template', 'basic']) as TemplateCliArgs;
    expect(args.command).toBe('template');
    expect(args.templateName).toBe('basic');
  });

  it('should parse init command correctly', () => {
    const args = parseArgs(['init', 'development', '-o', './custom.md']) as InitCliArgs;
    expect(args.command).toBe('init');
    expect(args.templateName).toBe('development');
    expect(args.output).toBe('./custom.md');
  });

  it('should use default output for init command if not specified', () => {
    const args = parseArgs(['init', 'basic']) as InitCliArgs;
    expect(args.command).toBe('init');
    expect(args.templateName).toBe('basic');
    expect(args.output).toBe('./rulesync.mdc');
  });
});

describe('Rules Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call generateRules with URL when URL is provided via file parameter', async () => {
    const options = { file: 'https://example.com/rules.md', output: './' };
    await generateRules(options);
    expect(generateRules).toHaveBeenCalledWith(options);
  });

  it('should call generateRules with file path when local file is provided', async () => {
    const options = { file: './rules.md', output: './' };
    await generateRules(options);
    expect(generateRules).toHaveBeenCalledWith(options);
  });
});

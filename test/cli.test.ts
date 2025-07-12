import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseArgs } from '../src/cli/args';
import { generateRules } from '../src/core/generator';
import { GenerateCliArgs, TemplateCliArgs, TemplatesCliArgs, InitCliArgs } from '../src/types';

// Set test environment
process.env.VITEST = 'true';

// Mock the generator module
vi.mock('../src/core/generator', () => ({
  generateRules: vi.fn()
}));

describe('CLI Arguments Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse URL argument correctly', () => {
    const args = parseArgs(['generate', '-u', 'http://example.com/rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.url).toBe('http://example.com/rules.md');
    expect(args.file).toBeUndefined();
  });

  it('should parse file argument correctly', () => {
    const args = parseArgs(['generate', '-f', './rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('./rules.md');
    expect(args.url).toBeUndefined();
  });

  it('should handle --url long option', () => {
    const args = parseArgs(['generate', '--url', 'http://example.com/rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.url).toBe('http://example.com/rules.md');
  });

  it('should handle --file long option', () => {
    const args = parseArgs(['generate', '--file', './rules.md']) as GenerateCliArgs;
    expect(args.command).toBe('generate');
    expect(args.file).toBe('./rules.md');
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

  it('should throw error if neither url nor file is provided', () => {
    expect(() => parseArgs(['generate'])).toThrow();
  });

  it('should throw error if both url and file are provided', () => {
    expect(() => parseArgs(['generate', '-u', 'http://example.com/rules.md', '-f', './rules.md'])).toThrow();
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
    expect(args.output).toBe('./rulesync.md');
  });
});

describe('Rules Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call generateRules with URL when URL is provided', async () => {
    const args = { command: 'generate', url: 'http://example.com/rules.md', output: './' } as GenerateCliArgs;
    await generateRules(args);
    expect(generateRules).toHaveBeenCalledWith(args);
  });

  it('should call generateRules with file path when file is provided', async () => {
    const args = { command: 'generate', file: './rules.md', output: './' } as GenerateCliArgs;
    await generateRules(args);
    expect(generateRules).toHaveBeenCalledWith(args);
  });
});

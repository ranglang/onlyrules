import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeBuddyFormatter } from '../../src/formatters/codebuddy';
import { ParsedRule, RuleGenerationContext } from '../../src/core/interfaces';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CodeBuddyFormatter', () => {
  let formatter: CodeBuddyFormatter;
  let tempDir: string;
  let context: RuleGenerationContext;

  beforeEach(async () => {
    formatter = new CodeBuddyFormatter();
    tempDir = await fs.mkdtemp(join(tmpdir(), 'codebuddy-test-'));
    context = {
      outputDir: tempDir,
      force: false,
      verbose: false
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('spec', () => {
    it('should have correct specification', () => {
      expect(formatter.spec).toEqual({
        id: 'codebuddy',
        name: 'Tencent Cloud CodeBuddy',
        category: 'directory',
        extension: '.md',
        supportsMultipleRules: true,
        requiresMetadata: true,
        defaultPath: '.codebuddy/rules'
      });
    });
  });

  describe('generateRule', () => {
    it('should generate a rule file with proper formatting', async () => {
      const rule: ParsedRule = {
        name: 'test-rule',
        content: '- Use TypeScript\n- Follow ESLint rules\n- Write tests',
        metadata: { version: '1.0', author: 'test' },
        isRoot: false
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, '.codebuddy/rules/test-rule.md'));

      const content = await fs.readFile(result.filePath!, 'utf-8');
      expect(content).toContain('# test-rule');
      expect(content).toContain('## Metadata');
      expect(content).toContain('version: 1.0');
      expect(content).toContain('author: test');
      expect(content).toContain('## Rule Type');
      expect(content).toContain('Project-Specific Rule');
      expect(content).toContain('## Development Guidelines');
      expect(content).toContain('- Use TypeScript');
      expect(content).toContain('### CodeBuddy Integration Notes');
    });

    it('should generate a global rule correctly', async () => {
      const rule: ParsedRule = {
        name: 'global-rule',
        content: '# Global Standards\n\nAlways use best practices',
        isRoot: true
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      const content = await fs.readFile(result.filePath!, 'utf-8');
      expect(content).toContain('Global Rule (Always Active)');
      expect(content).toContain('CodeBuddy is active in your IDE (always applied)');
    });

    it('should handle rules without metadata', async () => {
      const rule: ParsedRule = {
        name: 'simple-rule',
        content: 'Simple content',
        isRoot: false
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      const content = await fs.readFile(result.filePath!, 'utf-8');
      expect(content).not.toContain('## Metadata');
      expect(content).toContain('Simple content');
    });

    it('should preserve markdown headers with proper hierarchy', async () => {
      const rule: ParsedRule = {
        name: 'markdown-rule',
        content: '# Main Section\n## Subsection\n### Details\nContent here',
        isRoot: false
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      const content = await fs.readFile(result.filePath!, 'utf-8');
      expect(content).toContain('## Main Section');
      expect(content).toContain('### Subsection');
      expect(content).toContain('#### Details');
    });

    it('should fail when file exists and force is false', async () => {
      const rule: ParsedRule = {
        name: 'existing-rule',
        content: 'content',
        isRoot: false
      };

      // Create the file first
      const filePath = join(tempDir, '.codebuddy/rules/existing-rule.md');
      await fs.mkdir(join(tempDir, '.codebuddy/rules'), { recursive: true });
      await fs.writeFile(filePath, 'existing content');

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should overwrite when force is true', async () => {
      const rule: ParsedRule = {
        name: 'existing-rule',
        content: 'new content',
        isRoot: false
      };

      // Create the file first
      const filePath = join(tempDir, '.codebuddy/rules/existing-rule.md');
      await fs.mkdir(join(tempDir, '.codebuddy/rules'), { recursive: true });
      await fs.writeFile(filePath, 'old content');

      context.force = true;
      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('new content');
      expect(content).not.toContain('old content');
    });
  });

  describe('isRuleCompatible', () => {
    it('should return true for all rules', () => {
      const rule: ParsedRule = {
        name: 'any-rule',
        content: 'any content',
        isRoot: false
      };

      expect(formatter.isRuleCompatible(rule)).toBe(true);
    });
  });

  describe('getOutputPath', () => {
    it('should return correct path for named rule', () => {
      const rule: ParsedRule = {
        name: 'my-rule',
        content: 'content',
        isRoot: false
      };

      const path = formatter.getOutputPath(rule, context);
      expect(path).toBe(join(tempDir, '.codebuddy/rules/my-rule.md'));
    });

    it('should use default name when rule name is not provided', () => {
      const rule: ParsedRule = {
        name: '',
        content: 'content',
        isRoot: false
      };

      const path = formatter.getOutputPath(rule, context);
      expect(path).toBe(join(tempDir, '.codebuddy/rules/default.md'));
    });
  });
});
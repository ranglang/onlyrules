import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ParsedRule, RuleGenerationContext } from '../src/core/interfaces';
import { KiroFormatter } from '../src/formatters/kiro';

describe('KiroFormatter', () => {
  const formatter = new KiroFormatter();
  const testOutputDir = './test-output';
  const context: RuleGenerationContext = {
    outputDir: testOutputDir,
    force: true,
    verbose: false,
  };

  beforeEach(() => {
    // Clean up test directory before each test
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('spec', () => {
    it('should have correct specification', () => {
      expect(formatter.spec).toEqual({
        id: 'kiro',
        name: 'Kiro AI',
        category: 'directory',
        extension: '.md',
        supportsMultipleRules: true,
        requiresMetadata: true,
        defaultPath: '.kiro/steering',
      });
    });
  });

  describe('isRuleCompatible', () => {
    it('should accept all rules', () => {
      const rule: ParsedRule = {
        name: 'test-rule',
        content: 'Test content',
        isRoot: false,
      };
      expect(formatter.isRuleCompatible(rule)).toBe(true);
    });
  });

  describe('generateRule', () => {
    it('should generate product.md for product-related rules', async () => {
      const rule: ParsedRule = {
        name: 'Product Overview',
        content: '# Product Description\n\nThis is our amazing product.',
        isRoot: true,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(testOutputDir, '.kiro/steering/product.md'));

      expect(result.filePath).toBeDefined();
      const content = readFileSync(result.filePath as string, 'utf-8');
      expect(content).not.toContain('---'); // Default files don't need frontmatter
      expect(content).toContain('# Product Description');
    });

    it('should generate tech.md for technology stack rules', async () => {
      const rule: ParsedRule = {
        name: 'Technology Stack',
        content: '# Tech Stack\n\n- React\n- TypeScript\n- Node.js',
        isRoot: true,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(testOutputDir, '.kiro/steering/tech.md'));
    });

    it('should generate structure.md for architecture rules', async () => {
      const rule: ParsedRule = {
        name: 'Project Structure',
        content: '# Architecture\n\nOur project follows clean architecture.',
        isRoot: true,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(testOutputDir, '.kiro/steering/structure.md'));
    });

    it('should add fileMatch frontmatter for component-specific rules', async () => {
      const rule: ParsedRule = {
        name: 'Component Standards',
        content: '# React Component Guidelines\n\nAlways use functional components.',
        isRoot: false,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      const content = readFileSync(result.filePath as string, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain('inclusion: "fileMatch"');
      expect(content).toContain('fileMatchPattern: "components/**/*.{tsx,jsx,vue}"');
    });

    it('should add manual inclusion for specialized rules', async () => {
      const rule: ParsedRule = {
        name: 'Performance Optimization',
        content: '# Performance Guidelines\n\nOptimization strategies for our app.',
        isRoot: false,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      const content = readFileSync(result.filePath as string, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain('inclusion: "manual"');
    });

    it('should respect explicit inclusion metadata', async () => {
      const rule: ParsedRule = {
        name: 'API Standards',
        content: '# API Guidelines',
        isRoot: false,
        metadata: {
          inclusion: 'fileMatch',
          fileMatchPattern: 'app/api/**/*.ts',
        },
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      const content = readFileSync(result.filePath as string, 'utf-8');

      expect(content).toContain('inclusion: "fileMatch"');
      expect(content).toContain('fileMatchPattern: "app/api/**/*.ts"');
    });

    it('should handle test-specific rules', async () => {
      const rule: ParsedRule = {
        name: 'Testing Standards',
        content: '# Testing Best Practices',
        isRoot: false,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.filePath).toBeDefined();
      const content = readFileSync(result.filePath as string, 'utf-8');
      expect(content).toContain('fileMatchPattern: "**/*.{test,spec}.{ts,tsx,js,jsx}"');
    });

    it('should sanitize filenames properly', async () => {
      const rule: ParsedRule = {
        name: 'Complex Rule Name! With @ Special # Characters',
        content: 'Content',
        isRoot: false,
      };

      const result = await formatter.generateRule(rule, context);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('complex-rule-name-with-special-characters.md');
    });
  });

  describe('getOutputPath', () => {
    it('should generate correct paths', () => {
      const rule: ParsedRule = {
        name: 'test-rule',
        content: 'content',
        isRoot: false,
      };

      const path = formatter.getOutputPath(rule, context);
      expect(path).toBe(join(testOutputDir, '.kiro/steering/test-rule.md'));
    });
  });
});

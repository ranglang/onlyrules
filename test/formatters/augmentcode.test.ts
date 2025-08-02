import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AugmentcodeFormatter } from '../../src/formatters/augmentcode';
import { ParsedRule, RuleGenerationContext } from '../../src/core/interfaces';
import { existsSync, rmSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('AugmentcodeFormatter', () => {
  let testDir: string;
  let context: RuleGenerationContext;
  let formatter: AugmentcodeFormatter;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = join(tmpdir(), `onlyrules-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    
    context = {
      outputDir: testDir,
      force: true,
      verbose: false
    };

    formatter = new AugmentcodeFormatter();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should have correct formatter specification', () => {
    expect(formatter.spec.id).toBe('augmentcode');
    expect(formatter.spec.name).toBe('Augmentcode');
    expect(formatter.spec.extension).toBe('.md');
    expect(formatter.spec.supportsMultipleRules).toBe(true);
    expect(formatter.spec.defaultPath).toBe('.augment/rules');
  });

  it('should split multiple sections into separate files under .augment/rules', async () => {
    const rules: ParsedRule[] = [
      {
        name: 'general-guidelines',
        content: `---
name: general-guidelines
---

# General Coding Guidelines

- Write clean, readable code
- Use meaningful variable names
- Add comments for complex logic`,
        metadata: { name: 'general-guidelines' },
        isRoot: false
      },
      {
        name: 'react-best-practices',
        content: `---
name: react-best-practices
---

# React Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Optimize re-renders with useMemo and useCallback`,
        metadata: { name: 'react-best-practices' },
        isRoot: false
      },
      {
        name: 'typescript-conventions',
        content: `---
name: typescript-conventions
---

# TypeScript Conventions

- Enable strict mode in tsconfig.json
- Use proper type annotations
- Avoid 'any' type when possible`,
        metadata: { name: 'typescript-conventions' },
        isRoot: false
      }
    ];

    // Generate rules for each section
    const results = [];
    for (const rule of rules) {
      const result = await formatter.generateRule(rule, context);
      results.push(result);
    }

    // Verify all generations succeeded
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.format).toBe('augmentcode');
    });

    // Verify the directory structure was created
    const augmentDir = join(testDir, '.augment');
    const rulesDir = join(testDir, '.augment/rules');
    expect(existsSync(augmentDir)).toBe(true);
    expect(existsSync(rulesDir)).toBe(true);

    // Verify separate files were created
    const files = readdirSync(rulesDir);
    expect(files).toHaveLength(3);
    expect(files).toContain('general-guidelines.md');
    expect(files).toContain('react-best-practices.md');
    expect(files).toContain('typescript-conventions.md');

    // Verify file contents
    const generalGuidelinesContent = readFileSync(join(rulesDir, 'general-guidelines.md'), 'utf-8');
    expect(generalGuidelinesContent).toContain('type: "always"');
    expect(generalGuidelinesContent).toContain('description:');
    expect(generalGuidelinesContent).toContain('# General Coding Guidelines');
    expect(generalGuidelinesContent).toContain('Write clean, readable code');
    expect(generalGuidelinesContent).toContain('---'); // Should contain new frontmatter

    const reactContent = readFileSync(join(rulesDir, 'react-best-practices.md'), 'utf-8');
    expect(reactContent).toContain('type: "auto"');
    expect(reactContent).toContain('description:');
    expect(reactContent).toContain('# React Best Practices');
    expect(reactContent).toContain('Use functional components with hooks');
    expect(reactContent).toContain('---'); // Should contain new frontmatter

    const typescriptContent = readFileSync(join(rulesDir, 'typescript-conventions.md'), 'utf-8');
    expect(typescriptContent).toContain('type: "auto"'); // TypeScript is detected as framework
    expect(typescriptContent).toContain('description:');
    expect(typescriptContent).toContain('# TypeScript Conventions');
    expect(typescriptContent).toContain('Enable strict mode in tsconfig.json');
    expect(typescriptContent).toContain('---'); // Should contain new frontmatter
  });

  it('should sanitize file names correctly', async () => {
    const rules: ParsedRule[] = [
      {
        name: 'NextJs Prompt',
        content: '---\nname: NextJs Prompt\n---\n\nNext.js guidelines',
        metadata: { name: 'NextJs Prompt' },
        isRoot: false
      },
      {
        name: 'React Best Practices!',
        content: '---\nname: React Best Practices!\n---\n\nReact guidelines',
        metadata: { name: 'React Best Practices!' },
        isRoot: false
      },
      {
        name: 'TypeScript Rules & Standards',
        content: '---\nname: TypeScript Rules & Standards\n---\n\nTypeScript guidelines',
        metadata: { name: 'TypeScript Rules & Standards' },
        isRoot: false
      }
    ];

    // Generate rules
    for (const rule of rules) {
      const result = await formatter.generateRule(rule, context);
      expect(result.success).toBe(true);
    }

    // Verify sanitized file names
    const rulesDir = join(testDir, '.augment/rules');
    const files = readdirSync(rulesDir);
    expect(files).toContain('next-js-prompt.md');
    expect(files).toContain('react-best-practices.md');
    expect(files).toContain('type-script-rules-standards.md');
  });

  it('should determine rule types correctly based on content', async () => {
    const alwaysRule: ParsedRule = {
      name: 'always-included',
      content: '---\nname: always-included\n---\n\nThese are general guidelines that should always be included in every message.',
      metadata: { name: 'always-included' },
      isRoot: false
    };

    const autoRule: ParsedRule = {
      name: 'react-framework',
      content: '---\nname: react-framework\n---\n\nReact framework specific rules that should auto-detect when working with React.',
      metadata: { name: 'react-framework' },
      isRoot: false
    };

    const agentRequestedRule: ParsedRule = {
      name: 'specific-task',
      content: '---\nname: specific-task\n---\n\nSpecific task guidelines for particular scenarios.',
      metadata: { name: 'specific-task' },
      isRoot: false
    };

    // Generate rules
    await formatter.generateRule(alwaysRule, context);
    await formatter.generateRule(autoRule, context);
    await formatter.generateRule(agentRequestedRule, context);

    // Verify rule type metadata
    const rulesDir = join(testDir, '.augment/rules');
    
    const alwaysContent = readFileSync(join(rulesDir, 'always-included.md'), 'utf-8');
    expect(alwaysContent).toContain('type: "always"');
    expect(alwaysContent).toContain('description:');

    const autoContent = readFileSync(join(rulesDir, 'react-framework.md'), 'utf-8');
    expect(autoContent).toContain('type: "auto"');
    expect(autoContent).toContain('description:');

    const agentRequestedContent = readFileSync(join(rulesDir, 'specific-task.md'), 'utf-8');
    expect(agentRequestedContent).toContain('type: "agent_requested"');
    expect(agentRequestedContent).toContain('description:');
  });

  it('should handle empty rules gracefully', async () => {
    const rule: ParsedRule = {
      name: 'empty-rule',
      content: '---\nname: empty-rule\n---\n\n',
      metadata: { name: 'empty-rule' },
      isRoot: false
    };

    const result = await formatter.generateRule(rule, context);
    expect(result.success).toBe(true);

    const rulesDir = join(testDir, '.augment/rules');
    const filePath = join(rulesDir, 'empty-rule.md');
    expect(existsSync(filePath)).toBe(true);

    const fileContent = readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('type: "agent_requested"');
    expect(fileContent).toContain('description:');
    expect(fileContent).toContain('---'); // Should contain frontmatter
  });

  it('should overwrite existing files when force is true', async () => {
    const rule: ParsedRule = {
      name: 'test-rule',
      content: '---\nname: test-rule\n---\n\nOriginal content',
      metadata: { name: 'test-rule' },
      isRoot: false
    };

    // Generate rule first time
    const result1 = await formatter.generateRule(rule, context);
    expect(result1.success).toBe(true);

    // Modify rule content
    rule.content = '---\nname: test-rule\n---\n\nUpdated content';

    // Generate rule second time with force=true
    const result2 = await formatter.generateRule(rule, context);
    expect(result2.success).toBe(true);

    // Verify content was updated
    const filePath = join(testDir, '.augment/rules/test-rule.md');
    const fileContent = readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('Updated content');
    expect(fileContent).not.toContain('Original content');
  });

  it('should be compatible with all rules', () => {
    const testRule: ParsedRule = {
      name: 'test',
      content: 'test content',
      metadata: {},
      isRoot: false
    };

    expect(formatter.isRuleCompatible(testRule)).toBe(true);
  });
});

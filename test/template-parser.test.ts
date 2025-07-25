import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { parseRuleFile } from '../src/utils/templates';

describe('Template Parser', () => {
  const testDir = path.join(process.cwd(), 'test', 'fixtures');
  
  beforeEach(async () => {
    // Create test directories if they don't exist
    await fs.mkdir(testDir, { recursive: true });
    
    // Create test template files
    await fs.writeFile(
      path.join(testDir, 'simple.md'),
      `# Development AI Rules

## Code Style
- Use TypeScript for all JavaScript projects
- Follow the project's established code style

## Testing
- Write tests using Vitest
- Follow Test-Driven Development principles`
    );
    
    await fs.writeFile(
      path.join(testDir, 'basic.mdc'),
      `---
description: CSS file rules
name: global
globs: **.css
---

# Basic AI Rules

## General Instructions
- Respond in a clear, concise manner
- Provide accurate information based on your knowledge

---
description: JavaScript rules
name: javascript
globs: **.js
---

## Code Generation
- Follow best practices for JavaScript
- Include comments for complex sections`
    );
  });
  
  afterEach(async () => {
    try {
      // Clean up test template files
      await fs.unlink(path.join(testDir, 'simple.md'));
      await fs.unlink(path.join(testDir, 'basic.mdc'));
    } catch (err) {
      // Ignore errors if files don't exist
    }
  });

  describe('parseRuleFile', () => {
    it('should parse a simple markdown file as a single rule', async () => {
      const content = await fs.readFile(path.join(testDir, 'simple.md'), 'utf8');
      const rules = parseRuleFile(content, path.join(testDir, 'simple.md'));
      
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('simple');
      expect(rules[0].content).toContain('# Development AI Rules');
      expect(rules[0].content).toContain('## Code Style');
      expect(rules[0].content).toContain('## Testing');
    });
    
    it('should parse an mdc file with multiple rules', async () => {
      const content = await fs.readFile(path.join(testDir, 'basic.mdc'), 'utf8');
      const rules = parseRuleFile(content, path.join(testDir, 'basic.mdc'));
      
      expect(rules).toHaveLength(2);
      
      expect(rules[0].name).toBe('global');
      expect(rules[0].content).toContain('# Basic AI Rules');
      expect(rules[0].content).toContain('## General Instructions');
      
      expect(rules[1].name).toBe('javascript');
      expect(rules[1].content).toContain('## Code Generation');
    });
    
    it('should handle files with unknown extensions as a single rule', () => {
      const content = '# Some content\n\nMore content';
      const rules = parseRuleFile(content, 'unknown.txt');
      
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('unknown');
      expect(rules[0].content).toBe(content);
    });
    
    it('should handle empty content gracefully', () => {
      const content = '';
      const rules = parseRuleFile(content, 'empty.md');
      
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('empty');
      expect(rules[0].content).toBe('');
    });
  });
});

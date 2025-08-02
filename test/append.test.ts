import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { appendRulesToFile } from '../src/utils/append';

describe('appendRulesToFile', () => {
  const testSourceFile = './test-source.mdc';
  const testTargetFile = './test-target.mdc';

  afterEach(async () => {
    // Clean up test files
    if (existsSync(testSourceFile)) {
      await unlink(testSourceFile);
    }
    if (existsSync(testTargetFile)) {
      await unlink(testTargetFile);
    }
  });

  it('should create new target file when it does not exist', async () => {
    const sourceContent = 'New rule content';
    await writeFile(testSourceFile, sourceContent);

    await appendRulesToFile(testSourceFile, testTargetFile);

    expect(existsSync(testTargetFile)).toBe(true);
    const targetContent = await readFile(testTargetFile, 'utf-8');
    expect(targetContent).toBe('New rule content\n');
  });

  it('should append to existing target file with section separator', async () => {
    const existingContent = 'Existing rule content';
    const newContent = 'New rule content';
    
    await writeFile(testTargetFile, existingContent);
    await writeFile(testSourceFile, newContent);

    await appendRulesToFile(testSourceFile, testTargetFile);

    const targetContent = await readFile(testTargetFile, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    expect(targetContent).toBe(`Existing rule content

---
name: test-source-${today}
---

New rule content
`);
  });

  it('should handle empty target file correctly', async () => {
    const newContent = 'New rule content';
    
    await writeFile(testTargetFile, '');
    await writeFile(testSourceFile, newContent);

    await appendRulesToFile(testSourceFile, testTargetFile);

    const targetContent = await readFile(testTargetFile, 'utf-8');
    expect(targetContent).toBe('New rule content\n');
  });

  it('should handle whitespace-only target file correctly', async () => {
    const newContent = 'New rule content';
    
    await writeFile(testTargetFile, '   \n  \n  ');
    await writeFile(testSourceFile, newContent);

    await appendRulesToFile(testSourceFile, testTargetFile);

    const targetContent = await readFile(testTargetFile, 'utf-8');
    expect(targetContent).toBe('New rule content\n');
  });

  it('should trim whitespace from source content', async () => {
    const existingContent = 'Existing rule';
    const newContent = '  \n  New rule content  \n  ';
    
    await writeFile(testTargetFile, existingContent);
    await writeFile(testSourceFile, newContent);

    await appendRulesToFile(testSourceFile, testTargetFile);

    const targetContent = await readFile(testTargetFile, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    expect(targetContent).toBe(`Existing rule

---
name: test-source-${today}
---

New rule content
`);
  });

  it('should throw error for empty source file', async () => {
    await writeFile(testSourceFile, '');
    
    await expect(appendRulesToFile(testSourceFile, testTargetFile))
      .rejects.toThrow('Source file is empty or contains no content');
  });

  it('should throw error for whitespace-only source file', async () => {
    await writeFile(testSourceFile, '   \n  \n  ');
    
    await expect(appendRulesToFile(testSourceFile, testTargetFile))
      .rejects.toThrow('Source file is empty or contains no content');
  });

  it('should handle multiple appends correctly', async () => {
    const firstContent = 'First rule';
    const secondContent = 'Second rule';
    const thirdContent = 'Third rule';
    
    // First append - creates file
    await writeFile(testSourceFile, firstContent);
    await appendRulesToFile(testSourceFile, testTargetFile);
    
    // Second append - adds with separator
    await writeFile(testSourceFile, secondContent);
    await appendRulesToFile(testSourceFile, testTargetFile);
    
    // Third append - adds with separator
    await writeFile(testSourceFile, thirdContent);
    await appendRulesToFile(testSourceFile, testTargetFile);

    const targetContent = await readFile(testTargetFile, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    expect(targetContent).toBe(`First rule

---
name: test-source-${today}
---

Second rule

---
name: test-source-${today}
---

Third rule
`);
  });
});

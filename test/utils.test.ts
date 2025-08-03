import { describe, expect, it } from 'vitest';
// Import directly from the file to avoid module resolution issues in tests
import { updateAICoderulesSection } from '../src/utils/file-utils';

describe('File Utils', () => {
  describe('updateAICoderulesSection', () => {
    it('should append AI Coderules section when none exists', () => {
      const existingContent = `# Project files
node_modules/
dist/
.env
`;
      const aiRulesSection = `\n# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`;

      const result = updateAICoderulesSection(existingContent, aiRulesSection);

      expect(result).toBe(`# Project files
node_modules/
dist/
.env
\n# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`);
    });

    it('should replace existing AI Coderules section', () => {
      const existingContent = `# Project files
node_modules/
dist/
.env

# AI Coderules (managed by onlyrules)
*.md
`;
      const aiRulesSection = `
# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`;

      const result = updateAICoderulesSection(existingContent, aiRulesSection);

      // Our function should remove the AI Coderules section and add the new one
      const expected = `# Project files
node_modules/
dist/
.env

# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`;
      expect(result).toBe(expected);
    });

    it('should handle multiple AI Coderules sections', () => {
      const existingContent = `# Project files
node_modules/
dist/
.env

# AI Coderules (managed by onlyrules)
*.md

# Other stuff

# AI Coderules (managed by onlyrules)
*.txt
`;
      const aiRulesSection = `
# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`;

      const result = updateAICoderulesSection(existingContent, aiRulesSection);

      // Our function should remove all AI Coderules sections and add the new one
      const expected = `# Project files
node_modules/
dist/
.env

# Other stuff

# AI Coderules (managed by onlyrules)
*.md
!rulessync.md
`;
      expect(result).toBe(expected);
    });
  });
});

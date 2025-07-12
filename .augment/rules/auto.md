# Auto Rules for OnlyRules

description: Rules for working with rule files and templates in OnlyRules

## Rule File Handling
- Rule files should be in markdown format
- Follow the existing rule file structure in the project
- When parsing rules, handle edge cases like empty files and malformed content
- Use the reader utilities in src/utils/reader.ts for consistent file handling

## Template Usage
- Templates should be modular and reusable
- Use the template system in src/utils/templates.ts
- Follow the existing template patterns
- Templates should be customizable with clear parameters
- Document template variables in comments

import { basename } from 'node:path';
import { ApplyType, ParsedRule, RuleParser } from './interfaces';

/**
 * Default rule parser implementation
 */
export class DefaultRuleParser implements RuleParser {
  /**
   * Parse rules from content
   */
  parseRules(content: string, filePath?: string): ParsedRule[] {
    const fileName = filePath ? basename(filePath).split('.')[0] : 'default';
    const fileExt = filePath?.split('.').pop()?.toLowerCase();

    // If it's a simple markdown file (not .mdc), treat it as a single rule
    if (fileExt === 'md') {
      const metadata = this.extractMetadata(content);
      const applyType = (
        typeof metadata.applyType === 'string' ? metadata.applyType : 'manual'
      ) as ApplyType;
      const description =
        typeof metadata.description === 'string'
          ? metadata.description
          : this.extractDescriptionFromContent(content);
      const glob =
        typeof metadata.glob === 'string' ? metadata.glob : this.extractGlobFromContent(content);

      return [
        {
          name: fileName,
          content: content.trim(),
          metadata,
          isRoot: this.isRootRule(fileName),
          applyType,
          description,
          glob,
        },
      ];
    }

    // For .mdc files, parse as concatenated rules
    if (fileExt === 'mdc') {
      return this.parseMdcContent(content, fileName);
    }

    // Default to treating as a single rule if extension is unknown
    const metadata = this.extractMetadata(content);
    const applyType = (
      typeof metadata.applyType === 'string' ? metadata.applyType : 'manual'
    ) as ApplyType;
    const description =
      typeof metadata.description === 'string'
        ? metadata.description
        : this.extractDescriptionFromContent(content);
    const glob =
      typeof metadata.glob === 'string' ? metadata.glob : this.extractGlobFromContent(content);

    return [
      {
        name: fileName,
        content: content.trim(),
        metadata,
        isRoot: this.isRootRule(fileName),
        applyType,
        description,
        glob,
      },
    ];
  }

  /**
   * Validate rule content
   */
  validateRules(rules: ParsedRule[]): boolean {
    return rules.every((rule) => {
      return (
        rule.name && rule.name.trim().length > 0 && rule.content && rule.content.trim().length > 0
      );
    });
  }

  /**
   * Extract metadata from rule content
   */
  extractMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch?.[1]) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract YAML frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch?.[1]) {
      const frontmatter = frontmatterMatch[1];
      for (const line of frontmatter.split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          // Try to parse as JSON, fallback to string
          try {
            metadata[key] = JSON.parse(value);
          } catch {
            metadata[key] = value;
          }
        }
      }
    }

    return metadata;
  }

  /**
   * Extract section name from frontmatter if available
   * @param content The content to parse for frontmatter
   * @returns The name from frontmatter or null if not found
   */
  private extractNameFromFrontmatter(content: string): string | null {
    // Look for frontmatter at the beginning of content
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatterContent = frontmatterMatch[1];
    // Look for name field in frontmatter
    const nameMatch = frontmatterContent.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      return nameMatch[1].trim();
    }

    return null;
  }

  /**
   * Parse MDC content with multiple rule sections
   */
  private parseMdcContent(content: string, defaultName: string): ParsedRule[] {
    const rules: ParsedRule[] = [];

    // Split content by rule sections using frontmatter delimiters
    const sections = this.splitByFrontmatter(content);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const metadata = this.extractMetadata(section);

      // Get rule name from frontmatter using dedicated function, fallback to metadata or generate one
      const nameFromFrontmatter = this.extractNameFromFrontmatter(section);
      const name = nameFromFrontmatter || metadata.name || `${defaultName}-${i + 1}`;

      // Remove frontmatter from content
      const contentWithoutFrontmatter = section.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

      // Extract new properties from metadata
      const applyType = (
        typeof metadata.applyType === 'string' ? metadata.applyType : 'manual'
      ) as ApplyType;
      const description =
        typeof metadata.description === 'string'
          ? metadata.description
          : this.extractDescriptionFromContent(contentWithoutFrontmatter);
      const glob =
        typeof metadata.glob === 'string'
          ? metadata.glob
          : this.extractGlobFromContent(contentWithoutFrontmatter);

      rules.push({
        name: typeof name === 'string' ? name : `${defaultName}-${i + 1}`,
        content: contentWithoutFrontmatter,
        metadata,
        isRoot: this.isRootRule(typeof name === 'string' ? name : `${defaultName}-${i + 1}`),
        applyType,
        description,
        glob,
      });
    }

    // If no sections found, treat entire content as single rule
    if (rules.length === 0) {
      const metadata = this.extractMetadata(content);
      const applyType = (
        typeof metadata.applyType === 'string' ? metadata.applyType : 'manual'
      ) as ApplyType;
      const description =
        typeof metadata.description === 'string'
          ? metadata.description
          : this.extractDescriptionFromContent(content);
      const glob =
        typeof metadata.glob === 'string' ? metadata.glob : this.extractGlobFromContent(content);

      return [
        {
          name: defaultName,
          content: content.trim(),
          metadata,
          isRoot: this.isRootRule(defaultName),
          applyType,
          description,
          glob,
        },
      ];
    }

    return rules;
  }

  /**
   * Split content by frontmatter sections
   */
  private splitByFrontmatter(content: string): string[] {
    const sections: string[] = [];
    const pattern = /---\n[\s\S]*?\n---\n[\s\S]*?(?=---\n|$)/g;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      sections.push(match[0].trim());
    }

    return sections;
  }

  /**
   * Determine if a rule name indicates a root/global rule
   */
  private isRootRule(name: string): boolean {
    const rootNames = ['default', 'root', 'global', 'main', 'index'];
    return rootNames.includes(name.toLowerCase());
  }

  /**
   * Extract title from markdown content
   */
  extractTitleFromMarkdown(content: string): string {
    // Try to find the first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch?.[1]) {
      return titleMatch[1].trim();
    }

    // If no heading found, use the first non-empty line
    const firstLine = content.split('\n').find((line) => line.trim().length > 0);
    if (firstLine) {
      return firstLine.trim();
    }

    return 'AI Rules';
  }
}

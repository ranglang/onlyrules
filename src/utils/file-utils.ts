/**
 * Convert a string to snake_case for file naming
 * @param str The string to convert
 * @returns The string converted to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    // Replace spaces, hyphens, and underscores with a single hyphen
    .replace(/[\s_]+/g, '-')
    // Convert camelCase to kebab-case
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // Convert to lowercase
    .toLowerCase()
    // Remove any non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-');
}

/**
 * Updates or adds an AI Coderules section in a file content
 * @param existingContent The existing content of the file
 * @param aiRulesSection The new AI Coderules section to add
 * @returns The updated content with the AI Coderules section
 */
export function updateAICoderulesSection(existingContent: string, aiRulesSection: string): string {
  // Check if there are any AI Coderules sections
  if (existingContent.includes('# AI Coderules (managed by onlyrules)')) {
    // Split the content by lines to process it more reliably
    const lines = existingContent.split('\n');
    const result: string[] = [];
    
    // Process line by line
    let inAISection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line starts an AI Coderules section
      if (line.trim() === '# AI Coderules (managed by onlyrules)') {
        inAISection = true;
        continue; // Skip this line
      }
      
      // Check if we're exiting an AI section (next heading or end of file)
      if (inAISection && (line.startsWith('# ') || i === lines.length - 1)) {
        inAISection = false;
        // Only add this line if it's a new heading (not the end of file)
        if (line.startsWith('# ')) {
          result.push(line);
        }
        continue;
      }
      
      // Add non-AI section lines to the result
      if (!inAISection) {
        result.push(line);
      }
    }
    
    // Join the lines back together and add the new AI rules section
    let updatedContent = result.join('\n');
    
    // Clean up any consecutive newlines
    updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');
    
    // Ensure the content ends with a newline before adding the new section
    if (!updatedContent.endsWith('\n')) {
      updatedContent += '\n';
    }
    
    return updatedContent + aiRulesSection;
  } else {
    // No existing sections found, just append
    return existingContent + aiRulesSection;
  }
}

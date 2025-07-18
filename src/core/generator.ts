import { readRulesFromUrl, readRulesFromFile } from '../utils/reader';
import { writeRulesToFile } from '../utils/writer';
import { RuleFormat, RuleGenerationOptions } from '../types';
import chalk from 'chalk';
import { parseRuleFile } from '../utils/templates';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Import the new generator
import { generateRules as generateRulesV2 } from './generator-v2';

/**
 * Generate rule files for different AI assistants
 * @param options Rule generation options
 */
export async function generateRules(options: RuleGenerationOptions): Promise<void> {
  // Use the new plugin-based architecture by default
  // Fall back to legacy implementation if needed
  const useNewArchitecture = process.env.ONLYRULES_USE_LEGACY !== 'true';
  
  if (useNewArchitecture) {
    try {
      return await generateRulesV2(options);
    } catch (error) {
      console.warn(chalk.yellow('⚠ New architecture failed, falling back to legacy implementation'));
      console.warn(chalk.gray(`Error: ${(error as Error).message}`));
      // Fall through to legacy implementation
    }
  }

  // Legacy implementation
  // Get rules content
  let rulesContent: string;
  let filePath = '';
  
  // If direct rulesContent is provided, use it
  if (options.rulesContent) {
    rulesContent = options.rulesContent;
  } else {
    // Use default file if neither url nor file is provided
    if (!options.url && !options.file) {
      options.file = './rulesync.mdc';
    }

    // Get rules content from file or URL
    try {
      if (options.url) {
        rulesContent = await readRulesFromUrl(options.url);
        // Use the last part of the URL as the file name
        const urlParts = options.url.split('/');
        filePath = urlParts[urlParts.length - 1];
      } else if (options.file) {
        rulesContent = await readRulesFromFile(options.file);
        filePath = options.file;
      } else {
        throw new Error('Invalid options');
      }
    } catch (error) {
      throw new Error(`Failed to read rules: ${(error as Error).message}`);
    }
  }

  // Validate rules content
  if (!rulesContent || rulesContent.trim() === '') {
    throw new Error('Rules content is empty');
  }

  // Parse the rules content based on file type
  const rules = parseRuleFile(rulesContent, filePath);
  
  // Determine which formats to generate
  const formatsToGenerate = options.formats || [
    // Directory-based formats
    RuleFormat.COPILOT,
    RuleFormat.CURSOR,
    RuleFormat.CLINE,
    RuleFormat.ROO,
    
    // Root file formats
    RuleFormat.CLAUDE_ROOT,
    RuleFormat.GEMINI_ROOT,
    
    // Memory directory formats
    RuleFormat.CLAUDE_MEMORIES,
    RuleFormat.GEMINI_MEMORIES,
    
    // Legacy formats
    RuleFormat.AGENTS,
    RuleFormat.JUNIE,
    RuleFormat.WINDSURF,
    RuleFormat.TRAE,
    RuleFormat.AUGMENT,
    RuleFormat.AUGMENT_ALWAYS,
    RuleFormat.LINGMA_PROJECT
  ];

  // Determine if we should use IDE-style rule organization
  const useIdeStyleRules = options.ideStyle !== false; // Default to true if not specified
  
  // If we have multiple rules, handle them according to the chosen style
  if (rules.length > 1) {
    // Process each rule separately
    const allResults: Array<PromiseSettledResult<{format: RuleFormat; success: boolean; ruleName: string; error?: string}>> = [];
    
    if (useIdeStyleRules) {
      // IDE-style: Generate files for each format in their respective directories
      // Process each format separately
      for (const format of formatsToGenerate) {
        // Process each rule for this format
        for (const rule of rules) {
          if (!rule.name) continue; // Skip rules without names
          
          try {
            // Handle special cases for root vs non-root rules
            const isRoot = rule.name === 'default' || rule.name === 'root' || rule.name === 'global';
            const isSpecificFile = !isRoot;
            
            // For Claude and Gemini, we need to handle root and memory files differently
            if (format === RuleFormat.CLAUDE_ROOT || format === RuleFormat.GEMINI_ROOT) {
              // Only generate root files for root rules or the first rule if no explicit root
              if (isRoot || (rules.indexOf(rule) === 0 && !rules.some(r => r.name === 'default' || r.name === 'root' || r.name === 'global'))) {
                await writeRulesToFile(format, rule.content, options.output, options.force);
                
                allResults.push({
                  status: 'fulfilled',
                  value: {
                    format,
                    success: true,
                    ruleName: rule.name
                  }
                });
              }
            } else if (format === RuleFormat.CLAUDE_MEMORIES || format === RuleFormat.GEMINI_MEMORIES) {
              // Only generate memory files for non-root rules
              if (isSpecificFile) {
                await writeRulesToFile(format, rule.content, options.output, options.force, rule.name);
                
                allResults.push({
                  status: 'fulfilled',
                  value: {
                    format,
                    success: true,
                    ruleName: rule.name
                  }
                });
              }
            } else {
              // For other formats, pass the rule name for directory-based formats
              await writeRulesToFile(format, rule.content, options.output, options.force, rule.name);
              
              allResults.push({
                status: 'fulfilled',
                value: {
                  format,
                  success: true,
                  ruleName: rule.name
                }
              });
            }
          } catch (error) {
            allResults.push({
              status: 'rejected',
              reason: error instanceof Error ? error : new Error(String(error))
            });
          }
        }
      }
      
      // Also generate the IDE-style rules in .rules directory for backward compatibility
      const ideOutputDir = path.join(options.output, options.ideFolder || '.rules');
      
      // Create the directory if it doesn't exist
      if (!existsSync(ideOutputDir)) {
        await mkdir(ideOutputDir, { recursive: true });
      }
      
      // Process each rule and write it to the IDE directory with its name as filename
      for (const rule of rules) {
        if (!rule.name) continue; // Skip rules without names
        
        // Create the rule file with .mdc extension
        const ruleFilePath = path.join(ideOutputDir, `${rule.name}.mdc`);
        
        try {
          // Check if file exists and we're not forcing overwrite
          if (existsSync(ruleFilePath) && !options.force) {
            allResults.push({
              status: 'fulfilled',
              value: {
                format: 'mdc' as RuleFormat,
                success: false,
                error: `File ${ruleFilePath} already exists. Use --force to overwrite.`,
                ruleName: rule.name
              }
            });
            continue;
          }
          
          // Write the rule content to the file
          await writeFile(ruleFilePath, rule.content);
          
          allResults.push({
            status: 'fulfilled',
            value: {
              format: 'mdc' as RuleFormat,
              success: true,
              ruleName: rule.name
            }
          });
        } catch (error) {
          allResults.push({
            status: 'rejected',
            reason: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
      
      // Also generate traditional format files if requested
      if (options.generateTraditional) {
        for (const rule of rules) {
          // Create a subdirectory for this rule if it has a name
          const ruleOutputDir = rule.name ? path.join(options.output, rule.name) : options.output;
          
          // Generate rule files for each format
          const results = await Promise.allSettled(
            formatsToGenerate.map(async (format) => {
              try {
                await writeRulesToFile(format, rule.content, ruleOutputDir, options.force);
                return { format, success: true, ruleName: rule.name };
              } catch (error) {
                return { format, success: false, error: (error as Error).message, ruleName: rule.name };
              }
            })
          );
          
          allResults.push(...results);
        }
      }
    } else {
      // Traditional style: Create a directory for each rule
      for (const rule of rules) {
        // Create a subdirectory for this rule if it has a name
        const ruleOutputDir = rule.name ? path.join(options.output, rule.name) : options.output;
        
        // Generate rule files for each format
        const results = await Promise.allSettled(
          formatsToGenerate.map(async (format) => {
            try {
              // Handle special cases for root vs non-root rules
              const isRoot = rule.name === 'default' || rule.name === 'root' || rule.name === 'global';
              const isSpecificFile = !isRoot;
              
              // For Claude and Gemini, we need to handle root and memory files differently
              if (format === RuleFormat.CLAUDE_ROOT || format === RuleFormat.GEMINI_ROOT) {
                // Only generate root files for root rules or the first rule if no explicit root
                if (isRoot || (rules.indexOf(rule) === 0 && !rules.some(r => r.name === 'default' || r.name === 'root' || r.name === 'global'))) {
                  await writeRulesToFile(format, rule.content, ruleOutputDir, options.force);
                }
              } else if (format === RuleFormat.CLAUDE_MEMORIES || format === RuleFormat.GEMINI_MEMORIES) {
                // Only generate memory files for non-root rules
                if (isSpecificFile) {
                  await writeRulesToFile(format, rule.content, ruleOutputDir, options.force, rule.name);
                }
              } else {
                // For other formats, pass the rule name for directory-based formats
                await writeRulesToFile(format, rule.content, ruleOutputDir, options.force, rule.name);
              }
              
              return { format, success: true, ruleName: rule.name };
            } catch (error) {
              return { format, success: false, error: (error as Error).message, ruleName: rule.name };
            }
          })
        );
        
        allResults.push(...results);
      }
    }
    
    // Log results if verbose
    if (options.verbose) {
      allResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.success) {
            console.log(chalk.green(`✓ Generated ${value.format} for rule '${value.ruleName}'`));
          } else {
            console.log(chalk.red(`✗ Failed to generate ${value.format} for rule '${value.ruleName}': ${value.error}`));
          }
        } else if (result.status === 'rejected') {
          const error = result.reason as Error;
          console.log(chalk.red(`✗ Error: ${error.message}`));
        }
      });
    }
    
    // Count successes and failures
    const successes = allResults.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;
    const failures = allResults.length - successes;
    
    // Log summary
    console.log(
      chalk.bold(
        `Generated ${chalk.green(successes)} rule files across ${rules.length} rules${
          failures > 0 ? `, ${chalk.red(failures)} failed` : ''
        }`
      )
    );
  } else {
    // Single rule case - use the original content
    const singleRuleContent = rules[0].content;
    const ruleName = rules[0].name || 'default';
    
    // Generate rule files for each format
    const results = await Promise.allSettled(
      formatsToGenerate.map(async (format) => {
        try {
          // For Claude and Gemini, handle root files and memory files differently
          if (format === RuleFormat.CLAUDE_ROOT || format === RuleFormat.GEMINI_ROOT) {
            // Always generate root files for single rules
            await writeRulesToFile(format, singleRuleContent, options.output, options.force);
          } else if (format === RuleFormat.CLAUDE_MEMORIES || format === RuleFormat.GEMINI_MEMORIES) {
            // For single rules, don't generate memory files unless explicitly named
            if (ruleName !== 'default') {
              await writeRulesToFile(format, singleRuleContent, options.output, options.force, ruleName);
            }
          } else {
            // For other formats, pass the rule name for directory-based formats
            await writeRulesToFile(format, singleRuleContent, options.output, options.force, ruleName);
          }
          return { format, success: true };
        } catch (error) {
          return { format, success: false, error: (error as Error).message };
        }
      })
    );
    
    // Log results if verbose
    if (options.verbose) {
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.success) {
            console.log(chalk.green(`✓ Generated ${value.format}`));
          } else {
            console.log(chalk.red(`✗ Failed to generate ${value.format}: ${value.error}`));
          }
        } else if (result.status === 'rejected') {
          const error = result.reason as Error;
          console.log(chalk.red(`✗ Error: ${error.message}`));
        }
      });
    }
    
    // Count successes and failures
    const successes = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;
    const failures = results.length - successes;
    
    // Log summary
    console.log(
      chalk.bold(
        `Generated ${chalk.green(successes)} rule files${
          failures > 0 ? `, ${chalk.red(failures)} failed` : ''
        }`
      )
    );
  }
}

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import assert from 'assert';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary output directory
const outputDir = path.join(process.cwd(), 'test-output');
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

console.log('Testing multiple rule generation from rulesync.mdc...');

// Test end-to-end workflow: init -> append -> generate for Cursor
async function testEndToEndWorkflow() {
  const workflowDir = path.join(outputDir, 'end-to-end');
  fs.mkdirSync(workflowDir, { recursive: true });
  
  const originalCwd = process.cwd();
  process.chdir(workflowDir);
  
  try {
    // Step 1: Initialize a rulesync.mdc file using the basic template
    console.log('  📝 Step 1: Initialize rulesync.mdc with basic template');
    execSync(`node ${path.join(originalCwd, 'dist/cli.js')} init basic`, {
      stdio: 'inherit'
    });
    
    // Verify rulesync.mdc was created
    assert(fs.existsSync('./rulesync.mdc'), 'rulesync.mdc should be created by init command');
    
    const initialContent = fs.readFileSync('./rulesync.mdc', 'utf8');
    console.log('  ✅ Initial rulesync.mdc created successfully');
    
    // Step 2: Create additional rules to append
    console.log('  📝 Step 2: Create additional rules file');
    const additionalRules = `---
description: TypeScript specific rules
name: typescript
globs: "**/*.ts,**/*.tsx"
---

# TypeScript Rules

## Type Safety
- Always use strict TypeScript configuration
- Prefer explicit types over 'any'
- Use union types for better type safety

## Code Organization
- Use interfaces for object shapes
- Prefer const assertions for immutable data
- Use enums for related constants`;
    
    fs.writeFileSync('./additional-rules.mdc', additionalRules);
    console.log('  ✅ Additional rules file created');
    
    // Step 3: Append the additional rules to rulesync.mdc
    console.log('  📝 Step 3: Append additional rules to rulesync.mdc');
    execSync(`node ${path.join(originalCwd, 'dist/cli.js')} add -f ./additional-rules.mdc`, {
      stdio: 'inherit'
    });
    
    // Verify the content was appended with section separator
    const appendedContent = fs.readFileSync('./rulesync.mdc', 'utf8');
    assert(appendedContent.includes('---\n\n# TypeScript Rules'), 
      'Additional rules should be appended with section separator');
    assert(appendedContent.length > initialContent.length, 
      'rulesync.mdc should be longer after appending');
    console.log('  ✅ Rules appended successfully with section separator');
    
    // Step 4: Generate multiple rule files for Cursor
    console.log('  📝 Step 4: Generate multiple rule files for Cursor');
    execSync(`node ${path.join(originalCwd, 'dist/cli.js')} generate -f ./rulesync.mdc --target cursor`, {
      stdio: 'inherit'
    });
    
    // Verify Cursor rule files were generated
    const cursorDir = path.join('.', '.cursorrules');
    assert(fs.existsSync(cursorDir), 'Cursor rules directory should be created');
    
    const cursorFiles = fs.readdirSync(cursorDir);
    console.log('  📁 Generated Cursor files:', cursorFiles);
    
    // Check for expected rule files
    const expectedFiles = ['global.mdc', 'typescript.mdc'];
    expectedFiles.forEach(fileName => {
      const filePath = path.join(cursorDir, fileName);
      assert(fs.existsSync(filePath), `${fileName} should exist in Cursor rules directory`);
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      assert(fileContent.includes('cursorRuleType:'), 
        `${fileName} should contain Cursor-specific frontmatter`);
      
      if (fileName === 'global.mdc') {
        assert(fileContent.includes('Basic AI Rules') || fileContent.includes('General Instructions'), 
          'global.mdc should contain basic rules content');
      } else if (fileName === 'typescript.mdc') {
        assert(fileContent.includes('TypeScript Rules') && fileContent.includes('Type Safety'), 
          'typescript.mdc should contain TypeScript-specific rules');
      }
    });
    
    console.log('  ✅ Cursor rule files generated successfully');
    
    // Step 5: Verify the complete workflow integrity
    console.log('  📝 Step 5: Verify workflow integrity');
    
    // Check that original rulesync.mdc still exists and contains all content
    assert(fs.existsSync('./rulesync.mdc'), 'rulesync.mdc should still exist after generation');
    const finalContent = fs.readFileSync('./rulesync.mdc', 'utf8');
    assert(finalContent.includes('Basic AI Rules'), 'Should contain initial template content');
    assert(finalContent.includes('TypeScript Rules'), 'Should contain appended content');
    assert(finalContent.includes('---\n\n# TypeScript Rules'), 'Should maintain section separators');
    
    console.log('  ✅ Workflow integrity verified');
    
    // Clean up additional files
    fs.unlinkSync('./additional-rules.mdc');
    
    console.log('✅ End-to-end workflow test passed!');
    
  } finally {
    // Always restore original working directory
    process.chdir(originalCwd);
  }
}

// Test both traditional and IDE-style rule organization
async function runTests() {
  try {
    // Test 1: Traditional style (separate directories)
    console.log('\n🧪 Test 1: Traditional style organization (separate directories)');
    await testTraditionalStyle();
    
    // Test 2: IDE-style (single directory with multiple files)
    console.log('\n🧪 Test 2: IDE-style organization (single directory with multiple files)');
    await testIdeStyle();
    
    // Test 3: End-to-end workflow (init -> append -> generate)
    console.log('\n🧪 Test 3: End-to-end workflow (init -> append -> generate for Cursor)');
    await testEndToEndWorkflow();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  }
}

// Test traditional style organization (separate directories)
async function testTraditionalStyle() {
  const traditionalDir = path.join(outputDir, 'traditional');
  fs.mkdirSync(traditionalDir, { recursive: true });
  
  // Run the generate command with --no-ide-style flag
  execSync(`node ./dist/cli.js generate --file ./rulesync.mdc --output ${traditionalDir} --no-ide-style`, {
    stdio: 'inherit'
  });
  
  // Check if the output directory exists
  assert(fs.existsSync(traditionalDir), 'Traditional output directory should exist');
  
  // Check if subdirectories were created for each rule
  const globalDir = path.join(traditionalDir, 'global');
  const stylesheetDir = path.join(traditionalDir, 'stylesheet');
  
  assert(fs.existsSync(globalDir), 'Global rule directory should exist');
  assert(fs.existsSync(stylesheetDir), 'Stylesheet rule directory should exist');
  
  // Check if rule files were created in each directory
  const globalFiles = fs.readdirSync(globalDir);
  const stylesheetFiles = fs.readdirSync(stylesheetDir);
  
  console.log('Global rule files:', globalFiles);
  console.log('Stylesheet rule files:', stylesheetFiles);
  
  // Check content of one file to verify it contains the correct rule
  // Find a markdown file in the global directory
  const globalMdFile = globalFiles.find(file => file.endsWith('.md'));
  if (globalMdFile) {
    const globalContent = fs.readFileSync(path.join(globalDir, globalMdFile), 'utf8');
    assert(globalContent.includes('Basic AI Rules') || globalContent.includes('General Instructions'), 
      'Global rule should contain content from the global rule');
  } else {
    // Check .augment file as fallback
    const globalAugment = fs.readFileSync(path.join(globalDir, '.augment'), 'utf8');
    assert(globalAugment.includes('Basic AI Rules') || globalAugment.includes('General Instructions'), 
      'Global rule should contain content from the global rule');
  }
  
  // Find a markdown file in the stylesheet directory
  const stylesheetMdFile = stylesheetFiles.find(file => file.endsWith('.md'));
  if (stylesheetMdFile) {
    const stylesheetContent = fs.readFileSync(path.join(stylesheetDir, stylesheetMdFile), 'utf8');
    assert(stylesheetContent.includes('Content Guidelines'), 
      'Stylesheet rule should contain content from the stylesheet rule');
  } else {
    // Check .augment file as fallback
    const stylesheetAugment = fs.readFileSync(path.join(stylesheetDir, '.augment'), 'utf8');
    assert(stylesheetAugment.includes('Content Guidelines'), 
      'Stylesheet rule should contain content from the stylesheet rule');
  }
  
  console.log('✅ Traditional style test passed!');
}

// Test IDE-style organization (single directory with multiple files)
async function testIdeStyle() {
  const ideStyleDir = path.join(outputDir, 'ide-style');
  fs.mkdirSync(ideStyleDir, { recursive: true });
  
  // Test with custom IDE folder name
  const customFolderName = '.cursorrules';
  
  // Run the generate command with IDE-style (default) and custom folder name
  execSync(`node ./dist/cli.js generate --file ./rulesync.mdc --output ${ideStyleDir} --ide-folder ${customFolderName}`, {
    stdio: 'inherit'
  });
  
  // Check if the output directory exists
  assert(fs.existsSync(ideStyleDir), 'IDE-style output directory should exist');
  
  // Check if the custom IDE folder was created
  const rulesDir = path.join(ideStyleDir, customFolderName);
  assert(fs.existsSync(rulesDir), `Custom IDE folder '${customFolderName}' should exist`);
  
  // Check if rule files were created in the IDE folder
  const ruleFiles = fs.readdirSync(rulesDir);
  console.log(`Files in ${customFolderName}:`, ruleFiles);
  
  // Check for specific rule files
  const globalFile = path.join(rulesDir, 'global.mdc');
  const stylesheetFile = path.join(rulesDir, 'stylesheet.mdc');
  
  assert(fs.existsSync(globalFile), 'global.mdc file should exist');
  assert(fs.existsSync(stylesheetFile), 'stylesheet.mdc file should exist');
  
  // Check content of the rule files
  const globalContent = fs.readFileSync(globalFile, 'utf8');
  assert(globalContent.includes('Basic AI Rules') || globalContent.includes('General Instructions'), 
    'global.mdc should contain content from the global rule');
  
  const stylesheetContent = fs.readFileSync(stylesheetFile, 'utf8');
  assert(stylesheetContent.includes('Content Guidelines'), 
    'stylesheet.mdc should contain content from the stylesheet rule');
  
  console.log('✅ IDE-style test passed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DefaultRuleFormatterFactory } = require('./dist/cjs/core/factory');

async function testFormatters() {
  try {
    const factory = new DefaultRuleFormatterFactory();
    const formatters = factory.getAvailableFormatters();

    console.log('Registered formatters:');
    const paths = [];
    for (const [id, formatter] of formatters.entries()) {
      console.log(`- ${id}: ${formatter.spec.defaultPath}`);
      paths.push(formatter.spec.defaultPath);
    }

    console.log(`\nTotal formatters: ${formatters.size}`);

    // Check if claude-memories is registered
    const claudeMemories = formatters.get('claude-memories');
    if (claudeMemories) {
      console.log('\n✅ claude-memories formatter is registered!');
      console.log(`   Path: ${claudeMemories.spec.defaultPath}`);
    } else {
      console.log('\n❌ claude-memories formatter is NOT registered!');
    }

    // Show all unique paths that would be included in prunge
    const uniquePaths = [...new Set(paths)];
    console.log('\nPaths that would be removed by prunge:');
    uniquePaths.forEach((path) => console.log(`- ${path}`));
  } catch (error) {
    console.error('Error testing formatters:', error.message);
  }
}

testFormatters();

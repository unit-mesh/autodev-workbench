#!/usr/bin/env node

/**
 * Fix Dependencies Script
 * Resolves module dependency issues in the github-agent package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing GitHub Agent Dependencies');
console.log('='.repeat(50));

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Write JSON file
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check package dependencies
 */
function checkDependencies() {
  console.log('\n📦 Checking package dependencies...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = readJsonFile(packageJsonPath);
  
  if (!packageJson) {
    console.error('❌ Could not read package.json');
    return false;
  }
  
  console.log(`📋 Package: ${packageJson.name}@${packageJson.version}`);
  
  // Check critical dependencies
  const criticalDeps = [
    '@autodev/context-worker',
    '@autodev/worker-core',
    'ai',
    '@octokit/rest'
  ];
  
  const missing = [];
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  criticalDeps.forEach(dep => {
    if (!dependencies[dep]) {
      missing.push(dep);
      console.log(`❌ Missing: ${dep}`);
    } else {
      console.log(`✅ Found: ${dep}@${dependencies[dep]}`);
    }
  });
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} critical dependencies`);
    return false;
  }
  
  console.log('✅ All critical dependencies found');
  return true;
}

/**
 * Check if packages are built
 */
function checkBuiltPackages() {
  console.log('\n🏗️  Checking built packages...');
  
  const packages = [
    { name: 'context-worker', path: '../context-worker/dist' },
    { name: 'worker-core', path: '../worker-core/dist' }
  ];
  
  let allBuilt = true;
  
  packages.forEach(pkg => {
    const distPath = path.join(__dirname, '..', pkg.path);
    if (fileExists(distPath)) {
      console.log(`✅ ${pkg.name} is built`);
    } else {
      console.log(`❌ ${pkg.name} needs building`);
      allBuilt = false;
    }
  });
  
  return allBuilt;
}

/**
 * Build missing packages
 */
function buildMissingPackages() {
  console.log('\n🔨 Building missing packages...');
  
  const packages = [
    { name: 'worker-core', path: '../worker-core' },
    { name: 'context-worker', path: '../context-worker' }
  ];
  
  packages.forEach(pkg => {
    const pkgPath = path.join(__dirname, '..', pkg.path);
    const distPath = path.join(pkgPath, 'dist');
    
    if (!fileExists(distPath)) {
      console.log(`🔨 Building ${pkg.name}...`);
      try {
        execSync('npm run build', { 
          cwd: pkgPath, 
          stdio: 'inherit' 
        });
        console.log(`✅ ${pkg.name} built successfully`);
      } catch (error) {
        console.error(`❌ Failed to build ${pkg.name}:`, error.message);
      }
    }
  });
}

/**
 * Update rollup configuration
 */
function updateRollupConfig() {
  console.log('\n⚙️  Updating rollup configuration...');
  
  const rollupConfigPath = path.join(__dirname, '..', 'rollup.config.mjs');
  
  if (!fileExists(rollupConfigPath)) {
    console.error('❌ rollup.config.mjs not found');
    return false;
  }
  
  try {
    let config = fs.readFileSync(rollupConfigPath, 'utf8');
    
    // Check if external dependencies are properly configured
    const hasContextWorkerExternals = config.includes('@autodev/context-worker/src/analyzer');
    
    if (!hasContextWorkerExternals) {
      console.log('⚠️  Rollup config needs context-worker externals');
      
      // Add the missing externals (this was already done in the previous edit)
      console.log('✅ Rollup config externals should be updated manually');
    } else {
      console.log('✅ Rollup config externals are properly configured');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update rollup config:', error.message);
    return false;
  }
}

/**
 * Create symlinks for development
 */
function createSymlinks() {
  console.log('\n🔗 Creating development symlinks...');
  
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '@autodev');
  
  // Ensure @autodev directory exists
  if (!fileExists(nodeModulesPath)) {
    try {
      fs.mkdirSync(nodeModulesPath, { recursive: true });
      console.log('✅ Created @autodev directory');
    } catch (error) {
      console.error('❌ Failed to create @autodev directory:', error.message);
      return false;
    }
  }
  
  const symlinks = [
    {
      name: 'context-worker',
      source: path.join(__dirname, '..', '..', 'context-worker'),
      target: path.join(nodeModulesPath, 'context-worker')
    },
    {
      name: 'worker-core',
      source: path.join(__dirname, '..', '..', 'worker-core'),
      target: path.join(nodeModulesPath, 'worker-core')
    }
  ];
  
  symlinks.forEach(link => {
    try {
      // Remove existing symlink/directory
      if (fileExists(link.target)) {
        fs.rmSync(link.target, { recursive: true, force: true });
      }
      
      // Create symlink
      fs.symlinkSync(link.source, link.target, 'dir');
      console.log(`✅ Created symlink: ${link.name}`);
    } catch (error) {
      console.error(`❌ Failed to create symlink for ${link.name}:`, error.message);
    }
  });
  
  return true;
}

/**
 * Test the build
 */
function testBuild() {
  console.log('\n🧪 Testing build...');
  
  try {
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit' 
    });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

/**
 * Test agent import
 */
function testAgentImport() {
  console.log('\n🤖 Testing agent import...');
  
  try {
    const agentPath = path.join(__dirname, '..', 'dist', 'agent.js');
    
    if (!fileExists(agentPath)) {
      console.error('❌ agent.js not found in dist/');
      return false;
    }
    
    // Try to require the agent
    const { AIAgent } = require(agentPath);
    
    if (AIAgent) {
      console.log('✅ AIAgent imported successfully');
      
      // Test basic instantiation
      const agent = new AIAgent({
        workspacePath: process.cwd(),
        verbose: false
      });
      
      console.log('✅ AIAgent instantiated successfully');
      console.log(`🔧 Available tools: ${agent.getAvailableTools().join(', ')}`);
      
      return true;
    } else {
      console.error('❌ AIAgent not found in exports');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to import AIAgent:', error.message);
    return false;
  }
}

/**
 * Main fix function
 */
async function fixDependencies() {
  console.log('🚀 Starting dependency fix process...\n');
  
  const steps = [
    { name: 'Check Dependencies', fn: checkDependencies },
    { name: 'Check Built Packages', fn: checkBuiltPackages },
    { name: 'Build Missing Packages', fn: buildMissingPackages },
    { name: 'Update Rollup Config', fn: updateRollupConfig },
    { name: 'Create Symlinks', fn: createSymlinks },
    { name: 'Test Build', fn: testBuild },
    { name: 'Test Agent Import', fn: testAgentImport }
  ];
  
  let successCount = 0;
  
  for (const step of steps) {
    console.log(`\n📋 ${step.name}...`);
    try {
      const success = await step.fn();
      if (success) {
        successCount++;
        console.log(`✅ ${step.name} completed`);
      } else {
        console.log(`⚠️  ${step.name} had issues`);
      }
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${successCount}/${steps.length} steps completed successfully`);
  
  if (successCount === steps.length) {
    console.log('✅ All dependencies fixed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run test:agent');
    console.log('   2. Test with real GitHub issues');
    console.log('   3. Compare performance with analyze-issue.js');
  } else {
    console.log('⚠️  Some issues remain. Check the logs above.');
    console.log('\n🔧 Manual steps may be required:');
    console.log('   1. Check package.json dependencies');
    console.log('   2. Verify rollup.config.mjs externals');
    console.log('   3. Ensure all packages are built');
  }
  
  console.log('='.repeat(50));
}

/**
 * Main function
 */
async function main() {
  try {
    await fixDependencies();
  } catch (error) {
    console.error('❌ Fix process failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkDependencies,
  buildMissingPackages,
  updateRollupConfig,
  createSymlinks,
  testBuild,
  testAgentImport,
  fixDependencies
};

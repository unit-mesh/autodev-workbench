import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const installDependencyAnalysisTool: ToolLike = (installer) => {
  installer("analyze-dependencies", "Analyze project dependencies from package files and import statements", {
    analysis_type: z.enum(["package", "imports", "both"]).optional().describe("Type of dependency analysis (default: both)"),
    workspace_path: z.string().optional().describe("Path to analyze (defaults to current directory)"),
    include_dev_deps: z.boolean().optional().describe("Include development dependencies (default: true)"),
    include_peer_deps: z.boolean().optional().describe("Include peer dependencies (default: true)"),
    scan_imports: z.boolean().optional().describe("Scan source files for import statements (default: true)"),
    file_extensions: z.array(z.string()).optional().describe("File extensions to scan for imports (default: ['.js', '.ts', '.jsx', '.tsx'])"),
    max_depth: z.number().optional().describe("Maximum directory depth to scan (default: 5)"),
    exclude_dirs: z.array(z.string()).optional().describe("Directories to exclude from scanning")
  }, async ({ 
    analysis_type = "both",
    workspace_path,
    include_dev_deps = true,
    include_peer_deps = true,
    scan_imports = true,
    file_extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go'],
    max_depth = 5,
    exclude_dirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__']
  }: { 
    analysis_type?: "package" | "imports" | "both";
    workspace_path?: string;
    include_dev_deps?: boolean;
    include_peer_deps?: boolean;
    scan_imports?: boolean;
    file_extensions?: string[];
    max_depth?: number;
    exclude_dirs?: string[];
  }) => {
    try {
      // Resolve workspace path
      const workspacePath = workspace_path || process.env.WORKSPACE_PATH || process.cwd();
      const resolvedWorkspace = path.resolve(workspacePath);

      const result: any = {
        analysis: {
          workspace_path: workspacePath,
          resolved_path: resolvedWorkspace,
          analysis_type: analysis_type,
          timestamp: new Date().toISOString()
        },
        package_dependencies: null,
        import_dependencies: null,
        dependency_graph: null,
        security_analysis: null,
        recommendations: []
      };

      // Package file analysis
      if (analysis_type === "package" || analysis_type === "both") {
        const packageAnalysis = await analyzePackageFiles(resolvedWorkspace, include_dev_deps, include_peer_deps);
        result.package_dependencies = packageAnalysis;
      }

      // Import statement analysis
      if ((analysis_type === "imports" || analysis_type === "both") && scan_imports) {
        const importAnalysis = await analyzeImportStatements(
          resolvedWorkspace, 
          file_extensions, 
          max_depth, 
          exclude_dirs
        );
        result.import_dependencies = importAnalysis;
      }

      // Cross-reference analysis
      if (analysis_type === "both" && result.package_dependencies && result.import_dependencies) {
        result.dependency_graph = createDependencyGraph(result.package_dependencies, result.import_dependencies);
      }

      // Generate recommendations
      result.recommendations = generateRecommendations(result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing dependencies: ${error.message}`
          }
        ]
      };
    }
  });

  // Helper function to analyze package files
  async function analyzePackageFiles(workspacePath: string, includeDev: boolean, includePeer: boolean) {
    const packageFiles = [
      { file: 'package.json', type: 'npm' },
      { file: 'requirements.txt', type: 'pip' },
      { file: 'Pipfile', type: 'pipenv' },
      { file: 'pyproject.toml', type: 'poetry' },
      { file: 'go.mod', type: 'go' },
      { file: 'Cargo.toml', type: 'cargo' },
      { file: 'pom.xml', type: 'maven' },
      { file: 'build.gradle', type: 'gradle' }
    ];

    const foundPackages: any[] = [];
    const allDependencies: any = {};

    for (const pkg of packageFiles) {
      const filePath = path.join(workspacePath, pkg.file);
      if (fs.existsSync(filePath)) {
        try {
          const analysis = await analyzePackageFile(filePath, pkg.type, includeDev, includePeer);
          foundPackages.push(analysis);
          
          // Merge dependencies
          Object.keys(analysis.dependencies || {}).forEach(category => {
            if (!allDependencies[category]) allDependencies[category] = {};
            Object.assign(allDependencies[category], analysis.dependencies[category]);
          });
        } catch (error) {
          console.warn(`Warning: Could not analyze ${pkg.file}: ${error}`);
        }
      }
    }

    return {
      package_files_found: foundPackages.length,
      package_files: foundPackages,
      all_dependencies: allDependencies,
      total_dependencies: Object.values(allDependencies).reduce((sum: number, deps: any) => sum + Object.keys(deps).length, 0)
    };
  }

  // Helper function to analyze individual package file
  async function analyzePackageFile(filePath: string, type: string, includeDev: boolean, includePeer: boolean) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies: any = {};

    if (type === 'npm') {
      const packageJson = JSON.parse(content);
      
      if (packageJson.dependencies) {
        dependencies.production = packageJson.dependencies;
      }
      if (includeDev && packageJson.devDependencies) {
        dependencies.development = packageJson.devDependencies;
      }
      if (includePeer && packageJson.peerDependencies) {
        dependencies.peer = packageJson.peerDependencies;
      }
      if (packageJson.optionalDependencies) {
        dependencies.optional = packageJson.optionalDependencies;
      }

      return {
        file: path.basename(filePath),
        type: type,
        name: packageJson.name,
        version: packageJson.version,
        dependencies: dependencies,
        scripts: packageJson.scripts ? Object.keys(packageJson.scripts) : [],
        engines: packageJson.engines
      };
    } else if (type === 'pip') {
      // Parse requirements.txt
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      const deps: any = {};
      
      lines.forEach(line => {
        const match = line.match(/^([a-zA-Z0-9_-]+)([>=<~!]+.*)?$/);
        if (match) {
          deps[match[1]] = match[2] || '*';
        }
      });

      dependencies.production = deps;

      return {
        file: path.basename(filePath),
        type: type,
        dependencies: dependencies,
        total_packages: Object.keys(deps).length
      };
    } else if (type === 'go') {
      // Basic go.mod parsing
      const lines = content.split('\n');
      const deps: any = {};
      let inRequire = false;

      lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('require (')) {
          inRequire = true;
        } else if (line === ')' && inRequire) {
          inRequire = false;
        } else if (inRequire || line.startsWith('require ')) {
          const match = line.match(/([^\s]+)\s+([^\s]+)/);
          if (match && !line.startsWith('//')) {
            deps[match[1]] = match[2];
          }
        }
      });

      dependencies.production = deps;

      return {
        file: path.basename(filePath),
        type: type,
        dependencies: dependencies,
        total_packages: Object.keys(deps).length
      };
    }

    return {
      file: path.basename(filePath),
      type: type,
      dependencies: {},
      note: `Analysis for ${type} files not fully implemented`
    };
  }

  // Helper function to analyze import statements
  async function analyzeImportStatements(workspacePath: string, extensions: string[], maxDepth: number, excludeDirs: string[] | unknown) {
    const imports: any = {};
    const fileImports: any[] = [];
    
    // Ensure excludeDirs is an array of strings
    const safeExcludeDirs = Array.isArray(excludeDirs) ? excludeDirs.filter((dir): dir is string => typeof dir === 'string') : [];

    function scanDirectory(dirPath: string, currentDepth: number = 0) {
      if (currentDepth > maxDepth) return;

      try {
        const entries = fs.readdirSync(dirPath);
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry);
          const relativePath = path.relative(workspacePath, entryPath);
          
          // Skip excluded directories
          if (safeExcludeDirs.some(exclude => relativePath.includes(exclude))) continue;

          const stats = fs.statSync(entryPath);
          
          if (stats.isDirectory()) {
            scanDirectory(entryPath, currentDepth + 1);
          } else if (stats.isFile()) {
            const ext = path.extname(entry).toLowerCase();
            if (extensions.includes(ext)) {
              const fileImportData = analyzeFileImports(entryPath, relativePath);
              if (fileImportData.imports.length > 0) {
                fileImports.push(fileImportData);
                
                // Aggregate imports
                fileImportData.imports.forEach((imp: any) => {
                  if (!imports[imp.module]) {
                    imports[imp.module] = {
                      count: 0,
                      files: [],
                      type: imp.type
                    };
                  }
                  imports[imp.module].count++;
                  imports[imp.module].files.push(relativePath);
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Cannot scan directory ${dirPath}: ${error}`);
      }
    }

    scanDirectory(workspacePath);

    return {
      total_files_scanned: fileImports.length,
      unique_imports: Object.keys(imports).length,
      imports_by_module: imports,
      imports_by_file: fileImports,
      most_used_imports: Object.entries(imports)
        .sort(([,a]: any, [,b]: any) => b.count - a.count)
        .slice(0, 20)
        .map(([module, data]: any) => ({ module, ...data }))
    };
  }

  // Helper function to analyze imports in a single file
  function analyzeFileImports(filePath: string, relativePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports: any[] = [];
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
      // JavaScript/TypeScript imports
      const importRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push({
          module: match[1],
          type: match[1].startsWith('.') ? 'local' : 'external',
          statement: 'import',
          line: content.substring(0, match.index).split('\n').length
        });
      }
      
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push({
          module: match[1],
          type: match[1].startsWith('.') ? 'local' : 'external',
          statement: 'require',
          line: content.substring(0, match.index).split('\n').length
        });
      }
    } else if (ext === '.py') {
      // Python imports
      const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const module = match[1] || match[2];
        imports.push({
          module: module,
          type: module.startsWith('.') ? 'local' : 'external',
          statement: match[1] ? 'from_import' : 'import',
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }

    return {
      file: relativePath,
      imports: imports,
      import_count: imports.length
    };
  }

  // Helper function to create dependency graph
  function createDependencyGraph(packageDeps: { all_dependencies?: Record<string, Record<string, string>> }, importDeps: { imports_by_module?: Record<string, any> }) {
    const packageModules = new Set<string>();
    
    // Collect all package dependencies
    Object.values(packageDeps.all_dependencies || {}).forEach((deps) => {
      Object.keys(deps).forEach(dep => packageModules.add(dep));
    });

    const importModules = new Set<string>(Object.keys(importDeps.imports_by_module || {}));
    
    // Find unused dependencies (in package.json but not imported)
    const unusedDeps = [...packageModules].filter(dep => !importModules.has(dep));
    
    // Find missing dependencies (imported but not in package.json)
    const missingDeps = [...importModules].filter(imp => 
      !packageModules.has(imp) && 
      !imp.startsWith('.') && 
      !imp.startsWith('/') &&
      !['fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util'].includes(imp) // Node.js built-ins
    );

    return {
      total_package_dependencies: packageModules.size,
      total_imported_modules: importModules.size,
      unused_dependencies: {
        count: unusedDeps.length,
        modules: unusedDeps
      },
      missing_dependencies: {
        count: missingDeps.length,
        modules: missingDeps
      },
      dependency_overlap: {
        count: [...packageModules].filter(dep => importModules.has(dep)).length,
        percentage: packageModules.size > 0 ? Math.round(([...packageModules].filter(dep => importModules.has(dep)).length / packageModules.size) * 100) : 0
      }
    };
  }

  // Helper function to generate recommendations
  function generateRecommendations(result: any) {
    const recommendations: string[] = [];

    if (result.dependency_graph) {
      const { unused_dependencies, missing_dependencies } = result.dependency_graph;
      
      if (unused_dependencies.count > 0) {
        recommendations.push(`Found ${unused_dependencies.count} unused dependencies that could be removed to reduce bundle size`);
      }
      
      if (missing_dependencies.count > 0) {
        recommendations.push(`Found ${missing_dependencies.count} imported modules that are not declared as dependencies`);
      }
      
      if (unused_dependencies.count === 0 && missing_dependencies.count === 0) {
        recommendations.push("Dependency management looks good - all dependencies are properly declared and used");
      }
    }

    if (result.package_dependencies?.total_dependencies > 100) {
      recommendations.push("Large number of dependencies detected - consider auditing for unnecessary packages");
    }

    if (result.import_dependencies?.unique_imports > 50) {
      recommendations.push("High number of unique imports - consider code organization and potential for tree shaking");
    }

    return recommendations;
  }
};

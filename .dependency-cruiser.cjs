/**
 * Dependency Cruiser Configuration
 * 
 * Enforces architectural boundaries and prevents circular dependencies.
 * 
 * Run with: npx dependency-cruiser --validate .dependency-cruiser.cjs src/
 */

module.exports = {
  forbidden: [
    {
      name: 'domain-independence',
      comment: 'Domain layer must not depend on infrastructure or application layers',
      severity: 'error',
      from: { path: '^src/domain' },
      to: {
        path: '^src/(infrastructure|application|tools)',
        pathNot: '^src/domain'
      }
    },
    {
      name: 'infrastructure-to-tools',
      comment: 'Infrastructure should not depend on tools (MCP layer)',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/tools' }
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: {},
      circular: true
    },
    {
      name: 'domain-to-domain-ok',
      comment: 'Domain layer can depend on other domain modules',
      severity: 'info',
      from: { path: '^src/domain' },
      to: { path: '^src/domain' }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/[^/]+',
        theme: {
          graph: { splines: 'ortho' },
          modules: [
            {
              criteria: { matchesFocus: true },
              attributes: { fillcolor: '#ccffcc', penwidth: 2 }
            },
            {
              criteria: { source: '^src/domain' },
              attributes: { fillcolor: '#ffcccc' }
            },
            {
              criteria: { source: '^src/infrastructure' },
              attributes: { fillcolor: '#ccccff' }
            },
            {
              criteria: { source: '^src/application' },
              attributes: { fillcolor: '#ffffcc' }
            },
            {
              criteria: { source: '^src/tools' },
              attributes: { fillcolor: '#ffccff' }
            }
          ]
        }
      }
    }
  }
};


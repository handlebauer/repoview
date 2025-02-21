import type { Repository } from '@repoview/common'

export const DUMMY_REPO: Repository = {
    owner: 'test-org',
    name: 'test-repo',
    branch: 'main',
    lastUpdated: new Date(),
    files: {
        'README.md': `# Test Repository

This is a dummy repository for testing the editor component.

## Features
- Express server
- TypeScript
- Basic math utils`,
        'CHANGELOG.md': `# Changelog
v1.0.0 - Initial release`,
        'package.json': `{
  "name": "test-repo",
  "version": "1.0.0"
}`,
        'src/app.ts': `import express from 'express'

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`)
})`,
        'src/utils/helper.ts': `export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}`,
        'src/utils/string/format.ts': `export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}`,
        'src/utils/math/advanced.ts': `export function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}`,
        'src/types/index.ts': `export interface User {
  id: string;
  name: string;
}`,
        'src/components/Button.tsx': `export const Button = () => <button>Click me</button>`,
        'src/components/button.test.tsx': `test('button renders', () => {})`,
        'docs/API.md': `# API Documentation`,
        'docs/setup/01-installation.md': `# Installation Guide`,
        'docs/setup/02-configuration.md': `# Configuration Guide`,
        '.gitignore': `node_modules
dist
.env`,
        '.env.example': `PORT=3000
NODE_ENV=development`,
    },
}

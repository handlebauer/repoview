export const mockRepoFiles = {
    'src/app/page.tsx': `
export default function HomePage() {
    return (
        <div>
            <h1>Welcome to Demo App</h1>
            <p>This is a sample page</p>
        </div>
    )
}`,
    'src/components/button.tsx': `
export function Button({ children }) {
    return (
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
            {children}
        </button>
    )
}`,
    'package.json': `{
    "name": "demo-app",
    "version": "1.0.0",
    "dependencies": {
        "react": "^18.0.0",
        "next": "^13.0.0"
    }
}`,
    'README.md': `# Demo Repository
This is a sample repository for development purposes.
    
## Features
- Next.js
- React
- TypeScript
`,
}

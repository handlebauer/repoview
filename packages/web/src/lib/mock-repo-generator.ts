import { emitProgress } from './github'
import { sleep } from './utils'

interface MockRepoOptions {
    fileCount?: number
    treeDelay?: number
    fileDelay?: number
    shouldFail?: boolean
    failureRate?: number
}

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css']
const COMMON_DIRECTORIES = [
    'src',
    'components',
    'lib',
    'utils',
    'hooks',
    'pages',
    'styles',
    'public',
]

function generateMockPath() {
    const dirs = []
    const dirCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < dirCount; i++) {
        dirs.push(
            COMMON_DIRECTORIES[
                Math.floor(Math.random() * COMMON_DIRECTORIES.length)
            ],
        )
    }

    const fileName = `file-${Math.random().toString(36).substring(7)}${
        FILE_EXTENSIONS[Math.floor(Math.random() * FILE_EXTENSIONS.length)]
    }`

    return [...dirs, fileName].join('/')
}

function generateMockContent(path: string) {
    const ext = path.split('.').pop()
    switch (ext) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
            return `// Mock file: ${path}\nexport function Example() {\n  return null\n}`
        case 'json':
            return `{\n  "name": "mock-file",\n  "path": "${path}"\n}`
        case 'md':
            return `# Mock File\n\nThis is a mock markdown file at \`${path}\`.`
        case 'css':
            return `.mock-class {\n  color: blue;\n  /* ${path} */\n}`
        default:
            return `Mock content for ${path}`
    }
}

export async function generateMockRepo({
    fileCount = 50,
    treeDelay = 1000,
    fileDelay = 50,
    shouldFail = false,
    failureRate = 0.1,
}: MockRepoOptions = {}) {
    // Simulate initial tree fetch delay
    await sleep(treeDelay)

    if (shouldFail) {
        throw new Error('Simulated repository fetch failure')
    }

    const files: Record<string, string> = {}

    // Generate mock files
    for (let i = 0; i < fileCount; i++) {
        const path = generateMockPath()

        // Emit progress before delay
        emitProgress({
            type: 'fresh',
            totalFiles: fileCount,
            loadedFiles: i,
            currentFile: path,
        })

        // Simulate per-file delay
        await sleep(fileDelay)

        // Simulate random failures
        if (Math.random() < failureRate) {
            files[path] = `// Failed to load ${path}`
            continue
        }

        files[path] = generateMockContent(path)
    }

    // Final progress update
    emitProgress({
        type: 'fresh',
        totalFiles: fileCount,
        loadedFiles: fileCount,
    })

    return files
}

import { Repository } from './db'

const GITHUB_API_BASE = 'https://api.github.com'
const CACHE_DURATION = 60 * 60 // 1 hour

interface TreeItem {
    path: string
    mode: string
    type: 'blob' | 'tree'
    sha: string
    size?: number
    url: string
}

interface TreeResponse {
    sha: string
    truncated: boolean
    tree: TreeItem[]
}

interface GitHubContent {
    content: string
    encoding: 'base64' | 'utf-8'
    path: string
}

export class GitHubError extends Error {
    status: number
    documentation_url?: string

    constructor(message: string, status: number, documentation_url?: string) {
        super(message)
        this.status = status
        this.documentation_url = documentation_url
        this.name = 'GitHubError'
    }
}

async function fetchFromGitHubApi(path: string) {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
        headers,
        next: {
            revalidate: CACHE_DURATION,
            tags: [`github:${path}`],
        },
    })

    // Log cache status
    const cacheStatus = response.headers.get('x-vercel-cache')
    console.log(`Cache ${cacheStatus || 'MISS'} for GitHub API call: ${path}`)

    if (!response.ok) {
        const errorData = await response.json()
        throw new GitHubError(
            errorData.message || `GitHub API error: ${response.statusText}`,
            response.status,
            errorData.documentation_url,
        )
    }

    return response.json()
}

export async function fetchRemoteRepoTree(
    org: string,
    repo: string,
    branch = 'main',
): Promise<TreeResponse> {
    return fetchFromGitHubApi(
        `/repos/${org}/${repo}/git/trees/${branch}?recursive=1`,
    )
}

export async function fetchFileContent(
    org: string,
    repo: string,
    path: string,
): Promise<string> {
    const response: GitHubContent = await fetchFromGitHubApi(
        `/repos/${org}/${repo}/contents/${path}`,
    )

    if (response.encoding === 'base64') {
        return atob(response.content)
    }

    return response.content
}

// Progress event emitter
export interface ProgressEvent {
    type: 'cache' | 'fresh'
    totalFiles?: number
    loadedFiles?: number
    currentFile?: string
}

const progressListeners = new Set<(progress: ProgressEvent) => void>()

export function onProgress(listener: (progress: ProgressEvent) => void) {
    progressListeners.add(listener)
    return () => progressListeners.delete(listener)
}

export function emitProgress(progress: ProgressEvent) {
    progressListeners.forEach(listener => listener(progress))
}

// Remove unused batch-related functions and go straight to fetchRemoteRepository
export async function fetchRemoteRepository(
    org: string,
    repo: string,
    branch = 'main',
): Promise<Repository> {
    const treeData = await fetchRemoteRepoTree(org, repo, branch)
    const files = treeData.tree.filter(item => item.type === 'blob')
    const fileContents: Record<string, string> = {}

    emitProgress({
        type: 'fresh',
        totalFiles: files.length,
        loadedFiles: 0,
    })

    let loadedFiles = 0
    for (const file of files) {
        try {
            emitProgress({
                type: 'fresh',
                totalFiles: files.length,
                loadedFiles,
                currentFile: file.path,
            })

            fileContents[file.path] = await fetchFileContent(
                org,
                repo,
                file.path,
            )
            loadedFiles++
        } catch (err) {
            console.error(`Failed to fetch content for ${file.path}:`, err)
            fileContents[file.path] = `// Failed to load ${file.path}`
            loadedFiles++
        }

        emitProgress({
            type: 'fresh',
            totalFiles: files.length,
            loadedFiles,
            currentFile: file.path,
        })
    }

    // Final progress update
    emitProgress({
        type: 'fresh',
        totalFiles: files.length,
        loadedFiles: files.length,
    })

    return {
        owner: org,
        name: repo,
        branch,
        files: fileContents,
        lastUpdated: new Date(),
    }
}

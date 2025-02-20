export interface Repository {
    id?: number
    owner: string
    name: string
    branch: string
    files: Record<string, string>
    lastUpdated: Date
    localChanges?: Record<
        string,
        {
            content: string
            modified: Date
        }
    >
}

export interface ProgressEvent {
    type: 'cache' | 'fresh'
    totalFiles?: number
    loadedFiles?: number
    currentFile?: string
}

export interface APIError {
    message: string
    status: number
    documentation_url?: string
}

// Internal GitHub API types - these are only used by the server
export interface GitHubContent {
    content: string
    encoding: 'base64' | 'utf-8'
    path: string
}

export interface TreeItem {
    path: string
    mode: string
    type: 'blob' | 'tree'
    sha: string
    size?: number
    url: string
}

export interface TreeResponse {
    sha: string
    truncated: boolean
    tree: TreeItem[]
}

export interface GitHubErrorResponse {
    message: string
    documentation_url?: string
}

export class GitHubError extends Error implements APIError {
    constructor(
        message: string,
        public status: number,
        public documentation_url?: string,
    ) {
        super(message)
        this.name = 'GitHubError'
    }
}

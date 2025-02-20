import { APIError, Repository } from '@repoview/common'

const SERVER_API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export class GitHubError extends Error implements APIError {
    status: number
    documentation_url?: string

    constructor(message: string, status: number, documentation_url?: string) {
        super(message)
        this.status = status
        this.documentation_url = documentation_url
        this.name = 'GitHubError'
    }
}

export async function fetchRemoteRepository(
    org: string,
    repo: string,
): Promise<Repository> {
    try {
        console.log(
            '[fetchRemoteRepository] fetching',
            `${SERVER_API_BASE}/repo/${org}/${repo}`,
        )
        const response = await fetch(`${SERVER_API_BASE}/repo/${org}/${repo}`)

        if (!response.ok) {
            const errorData = await response.json()
            throw new GitHubError(
                errorData.message || `API error: ${response.statusText}`,
                response.status,
                errorData.documentation_url,
            )
        }

        return await response.json()
    } catch (error) {
        if (error instanceof GitHubError) {
            throw error
        }
        throw new Error(
            `Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
    }
}

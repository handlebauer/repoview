import { GitHubError } from './github'

export type ErrorType =
    | { type: 'rate_limit'; ip: string }
    | { type: 'not_found'; org: string; repo: string }
    | { type: 'unknown'; message: string }

export function createErrorMessage(error: ErrorType): string {
    switch (error.type) {
        case 'rate_limit':
            return `API rate limit exceeded for ${error.ip}`
        case 'not_found':
            return `Repository "${error.org}/${error.repo}" not found`
        case 'unknown':
            return error.message
    }
}

export function parseError(error: string): ErrorType {
    // Rate limit error
    const rateLimitMatch = error.match(/API rate limit exceeded for ([0-9.]+)/)
    if (rateLimitMatch) {
        return { type: 'rate_limit', ip: rateLimitMatch[1] }
    }

    // Not found error
    const notFoundMatch = error.match(/Repository "([^/]+)\/([^"]+)" not found/)
    if (notFoundMatch) {
        return {
            type: 'not_found',
            org: notFoundMatch[1],
            repo: notFoundMatch[2],
        }
    }

    // Unknown error
    return { type: 'unknown', message: error }
}

export function parseGitHubError(
    err: unknown,
    org?: string,
    repo?: string,
): ErrorType {
    if (err instanceof GitHubError) {
        if (err.message === 'Not Found' && org && repo) {
            return { type: 'not_found', org, repo }
        }
        if (err.message.includes('API rate limit exceeded')) {
            const match = err.message.match(
                /API rate limit exceeded for ([0-9.]+)/,
            )
            if (match) {
                return { type: 'rate_limit', ip: match[1] }
            }
        }
        return { type: 'unknown', message: err.message }
    }
    return {
        type: 'unknown',
        message:
            err instanceof Error ? err.message : 'An unknown error occurred',
    }
}

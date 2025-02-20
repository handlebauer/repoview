export const config = {
    githubHost: 'github.com',
    host: process.env.NEXT_PUBLIC_HOST!,
} as const

export function getHost() {
    if (typeof window === 'undefined')
        return process.env.NEXT_PUBLIC_HOST || 'repoview.now'
    return window.location.host
}

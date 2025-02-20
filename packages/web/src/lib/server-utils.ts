import { headers } from 'next/headers'

export async function getSearchParams() {
    const headersList = await headers()
    const urlString = headersList.get('x-url') || ''
    const url = new URL(urlString)
    return Object.fromEntries(url.searchParams.entries())
}

export async function isDevMode() {
    const params = await getSearchParams()
    return params.dev === 'true'
}

'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@/components/editor'

import { loadLocalRepository, Repository, saveLocalRepository } from '@/lib/db'
import { fetchRemoteRepository } from '@/lib/github'

interface RepoViewProps {
    org: string
    repo: string
}

export function RepoView({ org, repo }: RepoViewProps) {
    const [files, setFiles] = useState<Repository>()

    useEffect(() => {
        async function loadRepository() {
            const cacheKey = `${org}/${repo}/cached`
            const isCached = localStorage.getItem(cacheKey) === 'true'

            let data = await loadLocalRepository(org, repo, 'main')
            if (!isCached && !data) {
                data = await fetchRemoteRepository(org, repo, 'main')
                await saveLocalRepository(org, repo, 'main', data.files)
                localStorage.setItem(cacheKey, 'true')
            }

            setFiles(data)
        }

        loadRepository()
    }, [org, repo])

    return (
        <div className="h-screen">
            <Editor org={org} repo={repo} files={files} />
        </div>
    )
}

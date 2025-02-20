import Dexie from 'dexie'

import type { Repository } from '@repoview/common'
import type { Table } from 'dexie'

export class RepoViewDB extends Dexie {
    repositories!: Table<Repository>

    constructor() {
        super('RepoViewDB')
        this.version(1).stores({
            repositories: '++id, [owner+name+branch], lastUpdated',
        })
    }
}

export const db = new RepoViewDB()

// Simple wrapper to get repository with local changes
export async function loadLocalRepository(
    owner: string,
    name: string,
    branch = 'main',
) {
    return db.repositories
        .where(['owner+name+branch'])
        .equals([owner, name, branch])
        .first()
}

export async function saveLocalRepository(
    owner: string,
    name: string,
    branch: string,
    files: Record<string, string>,
) {
    await db.repositories.put({
        owner,
        name,
        branch,
        files,
        lastUpdated: new Date(),
    })
}

// Save local changes for a file
export async function saveLocalChange(
    owner: string,
    name: string,
    branch: string,
    filePath: string,
    content: string,
) {
    const repo = await loadLocalRepository(owner, name, branch)
    if (!repo) return

    const localChanges = repo.localChanges || {}
    localChanges[filePath] = {
        content,
        modified: new Date(),
    }

    await db.repositories.update(repo.id!, {
        localChanges,
    })
}

// Get all files with local changes merged over original content
export async function getMergedFiles(repository: Repository) {
    const files = { ...repository.files }
    if (repository.localChanges) {
        Object.entries(repository.localChanges).forEach(([path, change]) => {
            files[path] = change.content
        })
    }
    return files
}

// Clear all repositories from the database
export async function clearAllRepositories() {
    await db.repositories.clear()
}

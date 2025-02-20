import { RepoView } from './repo-view'

interface RepoViewPageProps {
    params: Promise<{
        org: string
        repo: string
    }>
}

export default async function RepoViewPage({ params }: RepoViewPageProps) {
    const { org, repo } = await params

    return <RepoView org={org} repo={repo} />
}

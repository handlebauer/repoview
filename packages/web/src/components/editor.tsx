'use client'

import { memo, useMemo } from 'react'
import { useEditor } from '@repoview/codemirror-extensions/hooks'

import type { Repository } from '@/lib/db'
import type { EditorConfig } from '@repoview/codemirror-extensions/hooks'

interface EditorProps {
    org: string
    repo: string
    files?: Repository
}

export const Editor = memo(function Editor({ repo, files }: EditorProps) {
    const mappedFiles = useMemo(() => {
        if (!files) return []
        return Object.entries(files.files).map(([name, content]) => ({
            name,
            content,
        }))
    }, [files])

    const editorOptions: EditorConfig = useMemo(
        () => ({
            initialContent: '',
            explorer: {
                initiallyOpen: true,
                width: '250px',
                keymap: { mac: 'Cmd-b', win: 'Ctrl-b' },
                initialFiles: mappedFiles,
                projectName: repo,
            },
            assistant: {
                initiallyOpen: false,
                width: '400px',
                keymap: { mac: 'Cmd-r', win: 'Ctrl-r' },
            },
        }),
        [mappedFiles, repo],
    )
    const { ref } = useEditor(editorOptions)

    if (mappedFiles.length === 0) {
        return <div className="w-screen h-screen bg-[#23272d]"></div>
    }

    return (
        <div className="w-full h-screen">
            <div ref={ref} className="h-full" />
        </div>
    )
})

'use client'

import { useEffect } from 'react'
import { useEditor } from '../../../../src/hooks'
import { demoFiles } from './data'

export function Editor() {
    const { ref, updateProjectName } = useEditor({
        initialContent: '',
        explorer: {
            projectName: 'My Project',
            dock: 'left',
            width: '250px',
            keymap: { mac: 'Cmd-b', win: 'Ctrl-b' },
            overlay: false,
            backgroundColor: '#2c313a',
            initiallyOpen: true,
            initialFiles: demoFiles,
            onFileSelect: filename => {
                console.log('Selected file:', filename)
            },
        },
        assistant: {
            width: '400px',
            backgroundColor: '#2c313a',
            keymap: { mac: 'Cmd-r', win: 'Ctrl-r' },
        },
    })

    useEffect(() => {
        // Update project name after 5 seconds
        updateProjectName('Updated Project Name')
    }, [updateProjectName])

    return (
        <div className="w-full h-screen">
            <div ref={ref} className="h-full" />
        </div>
    )
}

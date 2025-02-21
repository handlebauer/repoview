'use client'

import { DUMMY_REPO } from './dummy-data'
import { ExperimentalEditor } from './experimental-editor'

export default function DevEditor() {
    return (
        <div className="w-full h-screen">
            <ExperimentalEditor
                org="test-org"
                repo="test-repo"
                files={DUMMY_REPO}
            />
        </div>
    )
}

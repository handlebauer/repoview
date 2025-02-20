import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type FeatureFlags = {
    dev: boolean
    demo: boolean
    // Add more feature flags here as needed
}

const defaultFlags: FeatureFlags = {
    dev: false,
    demo: false,
}

export const useFeatureFlags = () => {
    const searchParams = useSearchParams()
    const [flags, setFlags] = useState<FeatureFlags>(defaultFlags)

    useEffect(() => {
        const newFlags = { ...defaultFlags }

        // Parse boolean flags from URL parameters
        for (const key of Object.keys(defaultFlags)) {
            const value = searchParams.get(key)
            if (value !== null) {
                newFlags[key as keyof FeatureFlags] = value === 'true'
            }
        }

        setFlags(newFlags)
    }, [searchParams])

    const isEnabled = useCallback(
        (flag: keyof FeatureFlags) => flags[flag],
        [flags],
    )

    return {
        flags,
        isEnabled,
    }
}

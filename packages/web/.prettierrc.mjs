const sortImports = {
    importOrder: [
        '^(react/(.*)$)|^(react$)',
        '^(next/(.*)$)|^(next$)',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@/lib/(.*)$',
        '^@/components/ui/(.*)$',
        '^@/components/.+/(.*)$',
        '^@/services/(.*)$',
        '^@/actions/(.*)$',
        '^@/hooks/(.*)$',
        '^@/store/(.*)$',
        '',
        '^[./]',
        '',
        '<TYPES>^(node:)',
        '<TYPES>',
        '<TYPES>^[.]',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
}

export default {
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 4,
    arrowParens: 'avoid',
    semi: false,

    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    ...sortImports,
}

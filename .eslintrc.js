module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': 'eslint:all',
    'parserOptions': {
        'ecmaVersion': 12,
        'sourceType': 'module'
    },
    'plugins': ['jsdoc'],
    'rules': {
        'func-style': [
            'error',
            'declaration'
        ],
        'function-call-argument-newline': 0,
        'indent': [
            'error',
            4
        ],
        'jsdoc/check-access': 1,
        'jsdoc/check-alignment': 1,
        'jsdoc/check-examples': 1,
        'jsdoc/check-indentation': 1,
        'jsdoc/check-line-alignment': 1,
        'jsdoc/check-param-names': 1,
        'jsdoc/check-property-names': 1,
        'jsdoc/check-syntax': 1,
        'jsdoc/check-tag-names': 1,
        'jsdoc/check-types': 1,
        'jsdoc/check-values': 1,
        'jsdoc/empty-tags': 1,
        'jsdoc/implements-on-classes': 1,
        'jsdoc/match-description': 1,
        'jsdoc/newline-after-description': 1,
        'jsdoc/no-bad-blocks': 1,
        'jsdoc/no-defaults': 1,
        'jsdoc/no-types': 0,
        'jsdoc/no-undefined-types': 1,
        'jsdoc/require-description': 1,
        'jsdoc/require-description-complete-sentence': 1,
        'jsdoc/require-example': 0,
        'jsdoc/require-file-overview': 1,
        'jsdoc/require-hyphen-before-param-description': 1,
        'jsdoc/require-jsdoc': 1,
        'jsdoc/require-param': 1,
        'jsdoc/require-param-description': 1,
        'jsdoc/require-param-name': 1,
        'jsdoc/require-param-type': 1,
        'jsdoc/require-property': 1,
        'jsdoc/require-property-description': 1,
        'jsdoc/require-property-name': 1,
        'jsdoc/require-property-type': 1,
        'jsdoc/require-returns': 1,
        'jsdoc/require-returns-check': 1,
        'jsdoc/require-returns-description': 1,
        'jsdoc/require-returns-type': 1,
        'jsdoc/require-throws': 1,
        'jsdoc/require-yields': 1,
        'jsdoc/require-yields-check': 1,
        'jsdoc/valid-types': 1,
        'linebreak-style': [
            'error',
            'unix'
        ],
        'max-lines': 0,
        'no-console': 0,
        'no-magic-numbers': 0,
        'no-nested-ternary': 0,
        'no-plusplus': 0,
        'no-ternary': 0,
        'no-trailing-spaces': 'error',
        'one-var': [
            'error',
            'never'
        ],
        'padded-blocks': [
            'error',
            'never'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'space-before-function-paren': [
            'error',
            'never'
        ]
    }
};

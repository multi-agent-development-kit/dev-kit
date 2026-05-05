# Cursor Rules - Programming Standards Documentation

Comprehensive programming rules and standards for LLM-assisted development. All rules follow clean markdown formatting without emojis for optimal token efficiency.

## File Organization

All rule files use category prefixes for clear organization:

- `swe-*` - Software Engineering (general coding standards)
- `python-*` - Python-specific rules
- `typescript-*` - TypeScript-specific rules
- `react-*` - React and component rules
- `nextjs-*` - Next.js framework rules
- `drizzle-*` - Drizzle ORM database rules
- `postgresql-*` - PostgreSQL database rules

## Rule Categories

### Software Engineering (General)

**swe-eslint-disable-rules.mdc**
- Never use eslint-disable comments - always fix root cause
- Covers all ESLint disable patterns and proper fixes
- Zero tolerance policy for type safety bypasses

**swe-commenting-best-practices.mdc**
- Write meaningful comments that explain "why", not "what"
- No migration history or obvious comments
- Focus on business logic and non-obvious decisions

**swe-detect-project-type-for-linting.mdc**
- Automatically detect project type for appropriate linting
- Configure linting tools based on project structure

**swe-escape-apostrophes-quotes.mdc**
- Properly escape quotes and apostrophes in JSX/HTML
- Use HTML entities or string expressions

**swe-no-build-commands.mdc**
- Never run build commands during development
- Use lint and type-check for validation instead

### Python

**python-no-type-ignore.mdc**
- Never use type ignore comments - fix type issues properly
- Covers all type ignore patterns: import-untyped, attr-defined, general
- Install type stubs, use conditional imports, define proper types

**python-automatic-linting-checks.mdc**
- Run linting immediately after creating/editing Python files
- Use ruff check --fix, black, mypy workflow
- Mandatory verification before task completion

**python-modern-type-annotations.mdc**
- Use Python 3.10+ modern syntax: dict[K,V], list[T], X | None
- Never use legacy typing.Dict, typing.Optional, typing.Union
- Complete migration to modern type annotation patterns

**python-timezone-aware-datetime.mdc**
- Always use datetime.now(timezone.utc) instead of deprecated datetime.utcnow()
- Use timezone-aware datetime objects for all operations

**python-function-return-type-annotations.mdc**
- All functions must have explicit return type annotations
- Use -> None for void functions, specific types for returns

**python-type-annotations-required.mdc**
- All variables, parameters, and returns require type annotations
- No implicit Any types allowed

**python-line-length-standards.mdc**
- Use 88 characters as standard line length (Black/Ruff default)
- Configure all tools consistently

**python-proper-exception-chaining.mdc**
- Always use "raise Exception() from e" for exception chaining
- Never use bare except clauses

**python-enforce-exception-chaining-b904.mdc**
- Enforce proper exception chaining with Ruff B904 rule
- Preserve stack traces and error context

**python-import-collections-abc-types.mdc**
- Import from collections.abc instead of deprecated collections types
- Use modern import patterns

**python-literal-types-proper-defaults.mdc**
- Use Literal types for fixed string/value options
- Provide proper defaults for Literal-typed parameters

**python-prefer-config-over-os-getenv.mdc**
- Use configuration classes instead of os.getenv() calls
- Centralized, type-safe configuration management

**python-provide-all-required-parameters.mdc**
- Always provide all required parameters to functions
- No relying on default parameter values when not intended

**python-use-genai.mdc**
- Use Google's genai library for AI/ML operations
- Follow modern AI integration patterns

**python-pydantic-v2-field-validator-required.mdc**
- Use Pydantic v2 field validators for data validation
- Modern validation patterns

**python-use-uv-pyproject-dependencies.mdc**
- Use uv and pyproject.toml for dependency management
- Modern Python packaging standards

### TypeScript

**typescript-no-type-bypasses.mdc**
- Never use any type or @ts-expect-error/@ts-ignore directives
- Use proper TypeScript types, unknown, protocols, type assertions
- Fix type issues with interfaces and proper casting

**typescript-explicit-return-types.mdc**
- All TypeScript functions must have explicit return types
- Prevents implicit any returns

**typescript-no-void-unused-variables.mdc**
- Never use void operator to suppress unused variable warnings
- Fix the root cause by removing or using variables

### React

**react-no-async-client-components.mdc**
- Never make client components async
- Use Server Components for async data fetching

**react-no-jsx-return-types.mdc**
- Don't explicitly type JSX.Element returns
- Let TypeScript infer JSX return types

**react-use-client-directive-guidelines.mdc**
- Default to Server Components, only use "use client" when needed
- Push "use client" down the component tree
- Never use with async functions

**react-no-inline-styles-use-cn.mdc**
- Use cn() utility for className composition
- No inline style objects

**react-prefer-shadcn-components.mdc**
- Use shadcn/ui components instead of building from scratch
- Consistent UI component library

**react-shadcn-component-styling.mdc**
- Style shadcn components at source with CVA variants
- Never add className overrides at call sites

**react-shadcn-install-components.mdc**
- Proper installation and usage of shadcn components
- Component configuration and customization

**react-use-searchparams-requires-suspense.mdc**
- Wrap useSearchParams() in Suspense boundary
- Prevent rendering errors

**react-use-refobject-not-mutablerefobject.mdc**
- Use RefObject instead of MutableRefObject for refs
- Proper ref typing patterns

### Next.js

**nextjs-15-async-params.mdc**
- Params and searchParams are Promises in Next.js 15
- Must await before accessing properties
- Use React use() hook in client components

**nextjs-api-route-data-handling.mdc**
- Proper data handling in API routes
- Request/response patterns

**nextjs-redirect-outside-try-catch.mdc**
- Never use redirect() inside try-catch blocks
- Use outside error handling for proper flow control

**nextjs-no-toast-in-server-actions.mdc**
- Never use toast() in Server Actions
- Return status and show toast in client components

**nextjs-prefer-image-component.mdc**
- Use Next.js Image component instead of <img> tags
- Automatic optimization and lazy loading

**nextjs-separate-server-client-utilities.mdc**
- Separate server-side imports from client-safe utilities
- Use *-constants.ts pattern for client-safe code
- Prevent server/client boundary violations

### Drizzle ORM

**drizzle-orm-type-safe-queries.mdc**
- Use Drizzle operators (eq, inArray, and, or) instead of raw SQL
- Never manually construct SQL with sql template for basic operations
- Prevent SQL injection with type-safe operators

**drizzle-pgtable-syntax.mdc**
- Proper pgTable syntax and schema definition
- Type-safe database schema patterns

**drizzle-use-package-json-scripts.mdc**
- Use package.json scripts for Drizzle operations
- Standardized workflow: db:generate, db:migrate, db:push, db:studio

### PostgreSQL

**postgresql-function-parameter-changes.mdc**
- Proper handling of PostgreSQL function parameter changes
- Migration and versioning strategies

## Recent Changes (2025-01-19)

### Consolidations
- 5 ESLint disable files → swe-eslint-disable-rules.mdc
- 2 TypeScript bypass files → typescript-no-type-bypasses.mdc
- 4 Python type-ignore files → python-no-type-ignore.mdc

### Removed Emojis
- All emojis removed from rule files for token efficiency
- Clean markdown formatting throughout

### File Renaming
- All files renamed with appropriate category prefixes
- Consistent naming convention applied

## Usage

These rules are automatically loaded by Cursor IDE when working in codebases. Each rule includes:

- Rule statement (what to do/not do)
- Context (why the rule exists)
- Correct and incorrect examples
- Proper solutions and patterns
- Checklist for AI assistants

## Contributing

When adding new rules:

1. Use appropriate category prefix (swe-, python-, typescript-, react-, nextjs-, drizzle-)
2. Include YAML frontmatter with description and globs
3. Follow clean markdown format (no emojis)
4. Provide clear examples of correct and incorrect usage
5. Include checklist for AI assistants

## Statistics

- Total Rules: 43 files
- Python Rules: 14
- React Rules: 8
- Next.js Rules: 6
- Software Engineering (General): 5
- TypeScript Rules: 3
- Drizzle ORM Rules: 3
- PostgreSQL Rules: 1
- Estimated Token Reduction: 40-50% from original

## File Format

All rule files use:
- `.mdc` extension (Markdown with comments)
- YAML frontmatter for metadata
- Clean markdown formatting
- Code examples in fenced blocks
- No emoji characters

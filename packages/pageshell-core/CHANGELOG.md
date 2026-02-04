# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-01

### Added

**Initial release** - Core utilities, hooks, and formatters extracted from `@repo/ui` PageShell composites.

#### Hooks
- `useDebounce` - Debounce value changes with configurable delay
- `useModal` - Modal state management with open/close callbacks
- `useFormLogic` - Form state management with auto-save, navigation guards, validation
- `useListLogic` - List/table state with search, filters, sorting, pagination
- `useWizardLogic` - Multi-step wizard state with validation, resumable progress

#### Utilities
- `cn` - Tailwind class name merger (clsx + tailwind-merge)
- `interpolate` - String interpolation with `{{key}}` syntax
- `mergeDefaults` - Deep merge with undefined handling and transformers
- `applyDefaults` - Apply defaults to array items
- `inference` - Auto-infer formats, alignments, variants for columns, filters, stats

#### Formatters
- `formatCurrency` - BRL currency formatting from cents
- `formatDate` - Relative and absolute date formatting (pt-BR)
- `formatNumber` - Number formatting with compact notation
- `formatPercent` - Percentage formatting
- `formatValue` - Universal value formatter by format type

#### Types
- Common types for PageShell composites (columns, filters, actions, etc.)

### Notes

- 93.89% test coverage (417 tests)
- Zero external runtime dependencies
- Tree-shakeable ESM build with TypeScript declarations

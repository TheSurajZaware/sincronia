# Fluent Guide

Fluent is the metadata layer in Sincronia.

## Recommended structure

```text
apps/<app-name>/
  fluent/
    tables/
    business-rules/
    client-scripts/
    rest-apis/
    acls/
  src/
    includes/
    utils/
```

## Workflow

1. Define metadata in `fluent/`.
2. Implement runtime logic in `src/`.
3. Run `sincronia build`.
4. Run `sincronia deploy --env <env>`.

## Caching behavior

Sincronia fingerprints Fluent files and can skip compile/build paths when metadata is unchanged (unless `--force` is set).

## Naming rules

Fluent artifact filenames are validated by lint plugin using `^[a-z][a-z0-9_]*$`.

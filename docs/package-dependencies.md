# Required Package Dependencies for Cache Implementation

Add these dependencies to your `package.json`:

## Production Dependencies

```json
{
  "dependencies": {
    "swr": "^2.2.5",
    "dexie": "^4.0.5",
    "lz-string": "^1.5.0",
    "date-fns": "^3.6.0"
  }
}
```

## Installation Command

```bash
pnpm add swr dexie lz-string date-fns
```

## Optional Dependencies (if not already installed)

```json
{
  "dependencies": {
    "lucide-react": "^0.400.0"  // For icons (if not present)
  }
}
```

## Dev Dependencies (if needed)

```json
{
  "devDependencies": {
    "@types/node": "^20.14.0"
  }
}
```

## Version Notes

- **SWR 2.2.5**: Latest stable with built-in cache provider support
- **Dexie 4.0.5**: Latest IndexedDB wrapper with TypeScript support
- **LZ-String 1.5.0**: Efficient string compression
- **Date-fns 3.6.0**: For date formatting (formatDistanceToNow)

## Verify Installation

After installing, verify with:

```bash
pnpm list swr dexie lz-string date-fns
```

## Browser Requirements

The cache implementation requires:
- IndexedDB support (all modern browsers)
- Service Worker support (Chrome 45+, Firefox 44+, Safari 11.1+)
- localStorage support (all modern browsers)
- BroadcastChannel API (Chrome 54+, Firefox 38+)

For older browsers, the implementation gracefully degrades to basic functionality.
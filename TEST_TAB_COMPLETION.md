# Tab Completion Testing Guide

## Issue Identified
The tests were passing but actual tab completion wasn't working because:
1. Tests validated completer logic in isolation
2. Commands didn't resolve references (e.g., `#index` → `index.tsx`)

## Fixes Applied
1. Added reference resolution to `/info` command
2. Added debug logging (enable with `DEBUG_COMPLETION=1`)
3. Commands now understand `#file`, `.folder#file`, and `@template` references

## How to Test

### 1. Build the Project
```bash
npm run build
```

### 2. Navigate to a React Project
```bash
cd /path/to/your/react/project
# OR create a test project:
mkdir test-project && cd test-project
npm init -y
mkdir -p src/components
echo 'export const Button = () => <button>Click</button>;' > src/components/Button.tsx
echo 'export const Input = () => <input />;' > src/components/Input.tsx
echo 'export const index = () => <div>App</div>;' > src/index.tsx
```

### 3. Run ReactGen
```bash
node /path/to/react-gen/dist/cli.js
```

### 4. Initialize
```
/init
```

### 5. Test Tab Completion

#### Test 1: File Reference Completion
```
/info #[TAB]
```
Expected: Shows list of all files like `#Button`, `#Input`, `#index`

```
/info #ind[TAB]
```
Expected: Completes to `/info #index`

```
/info #index[ENTER]
```
Expected: Shows file info for index.tsx

#### Test 2: Partial Match
```
/info #But[TAB]
```
Expected: Completes to `/info #Button`

#### Test 3: Folder Reference
```
/test .src[TAB]
```
Expected: Completes to `.src` or shows subfolders

#### Test 4: Nested Reference
```
/test .src.components#But[TAB]
```
Expected: Completes to `/test .src.components#Button`

#### Test 5: Template Reference
```
/test @form[TAB]
```
Expected: Shows `@form:login`, `@form:signup`, etc.

### 6. Enable Debug Mode (if issues persist)
```bash
DEBUG_COMPLETION=1 node /path/to/react-gen/dist/cli.js
```

Then try tab completion again. You'll see debug output like:
```
[DEBUG] Line: "/info #ind"
[DEBUG] Token: "#ind"
[DEBUG] Completions: ["#index"]
[DEBUG] State initialized: true
[DEBUG] Files in map: 3
```

## Expected Behavior

### What Should Work
✅ `/info #index` → Shows file info
✅ `/info #But[TAB]` → Completes to `#Button`
✅ `/test #Button` → Resolves and shows path
✅ Tab completion preserves command prefix

### What Won't Work Yet
❌ References in other commands (only `/info` and `/test` support them)
❌ Template generation (Phase 3 feature)

## Common Issues

### Issue: Tab shows completion but doesn't insert it
**Cause:** Readline shows options when there's ambiguity
**Solution:** Type more characters to narrow down the match

### Issue: "File not found: #index"
**Cause:** Command received reference but couldn't resolve it
**Solution:**
1. Check `/list` to see available files
2. Try with debug mode: `DEBUG_COMPLETION=1`
3. Verify file actually exists in project map

### Issue: No completions appear
**Cause:** Project not initialized
**Solution:** Run `/init` first

### Issue: Completions show wrong files
**Cause:** Cached project map is stale
**Solution:** Run `/init --force` to rescan

## Report Issues

If tab completion still doesn't work after these fixes:
1. Run with `DEBUG_COMPLETION=1`
2. Note the debug output
3. Share the output and expected behavior

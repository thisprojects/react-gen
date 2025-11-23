# Integration Testing Guide

## Manual Integration Test Checklist

### Setup
1. Build the project: `npm run build`
2. Navigate to a React project with components
3. Launch ReactGen: `node /path/to/react-gen/dist/cli.js`

### Test Case 1: Basic Initialization
- [ ] Run `/init`
- [ ] Verify project scan completes
- [ ] Check that files and components are detected
- [ ] Verify `.reactgen/project-map.json` is created

### Test Case 2: File Reference Completion
- [ ] Type `#` and press TAB
- [ ] Verify list of all component files appears
- [ ] Type `#But` and press TAB
- [ ] Verify it completes to a Button file (if exists)
- [ ] Press ENTER to see what happens with the reference

### Test Case 3: Folder Reference Completion
- [ ] Type `.` and press TAB
- [ ] Verify top-level folders appear (src, app, components)
- [ ] Type `.src.` and press TAB
- [ ] Verify nested folders appear
- [ ] Type `.src.comp` and press TAB
- [ ] Verify it completes to `.src.components`

### Test Case 4: Template Reference Completion
- [ ] Type `@` and press TAB
- [ ] Verify all templates appear
- [ ] Type `@form` and press TAB
- [ ] Verify form templates appear (form:login, form:signup, etc.)
- [ ] Type `@form:` and press TAB
- [ ] Verify specific form templates

### Test Case 5: Test Command
- [ ] Run `/test #Button` (replace with actual file)
- [ ] Verify reference resolves successfully
- [ ] Check that file metadata is displayed (type, lines, exports)
- [ ] Run `/test .src.components#Header`
- [ ] Verify nested reference resolves
- [ ] Run `/test @form:login`
- [ ] Verify template message appears

### Test Case 6: Test Command Error Handling
- [ ] Run `/test #NonExistent`
- [ ] Verify helpful error message appears
- [ ] Run `/test .invalid.path#File`
- [ ] Verify error message with tip about TAB completion

### Test Case 7: Cache Functionality
- [ ] Run `/init` (first time)
- [ ] Exit with `/exit`
- [ ] Launch ReactGen again
- [ ] Run `/init`
- [ ] Verify "Using cached project map" message appears
- [ ] Run `/init --force`
- [ ] Verify cache is bypassed and rescan occurs

### Test Case 8: Help Command
- [ ] Run `/help`
- [ ] Verify `/test` command is documented
- [ ] Verify TAB completion tip appears

### Test Case 9: Edge Cases
- [ ] Type `#` alone and press TAB multiple times
- [ ] Verify it doesn't crash
- [ ] Type invalid characters and press TAB
- [ ] Try completion mid-command: "some text @form" + TAB
- [ ] Verify completion works at cursor position

### Expected Behaviors
- ✅ TAB completion shows relevant matches
- ✅ Multiple TAB presses cycle through completions
- ✅ Invalid references show helpful errors
- ✅ File references resolve to correct paths
- ✅ Nested folder paths work correctly
- ✅ Template references are recognized

### Known Limitations
- Readline behavior varies by terminal (xterm, bash, zsh)
- Some terminals may not support advanced completion features
- Windows terminals may behave differently

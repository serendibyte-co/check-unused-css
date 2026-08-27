export const IGNORE_COMMENT_PATTERNS = {
    disable: /check-unused-css-disable(?!-next-line)/,
    disableNextLine: /check-unused-css-disable-next-line/,
};
// Compile regex once for performance
const SINGLE_LINE_COMMENT_REGEX = /\/\/(.*)/;
const BLOCK_COMMENT_REGEX = /\/\*(.*?)\*\//g;
const checkIgnoreDirectives = (commentContent, lineNumber, state) => {
    const trimmed = commentContent.trim();
    if (IGNORE_COMMENT_PATTERNS.disable.test(trimmed)) {
        state.isFileIgnored = true;
    }
    if (IGNORE_COMMENT_PATTERNS.disableNextLine.test(trimmed)) {
        state.ignoredLines.add(lineNumber + 1);
    }
};
const processSingleLineComment = (line, lineNumber, state) => {
    const match = line.match(SINGLE_LINE_COMMENT_REGEX);
    if (match?.[1]) {
        checkIgnoreDirectives(match[1], lineNumber, state);
    }
};
const processSingleLineBlockComments = (line, lineNumber, state) => {
    let found = false;
    for (const match of line.matchAll(BLOCK_COMMENT_REGEX)) {
        if (match[1]) {
            checkIgnoreDirectives(match[1], lineNumber, state);
            found = true;
        }
    }
    return found;
};
const processMultiLineBlockCommentContinuation = (line, lineNumber, state) => {
    const endIndex = line.indexOf('*/');
    if (endIndex === -1) {
        state.blockCommentContent += `${line}\n`;
        return;
    }
    state.blockCommentContent += line.substring(0, endIndex);
    checkIgnoreDirectives(state.blockCommentContent, lineNumber, state);
    state.inBlockComment = false;
    state.blockCommentContent = '';
};
const processMultiLineBlockCommentStart = (line, lineNumber, state) => {
    const startIndex = line.indexOf('/*');
    if (startIndex === -1) {
        return false;
    }
    const afterStart = line.substring(startIndex + 2);
    const endIndex = afterStart.indexOf('*/');
    if (endIndex !== -1) {
        const content = afterStart.substring(0, endIndex);
        checkIgnoreDirectives(content, lineNumber, state);
    }
    else {
        state.inBlockComment = true;
        state.blockCommentContent = afterStart;
    }
    return true;
};
/**
 * Parses ignore comments from source content (CSS or TS).
 */
export const parseIgnoreComments = (content) => {
    const state = {
        isFileIgnored: false,
        ignoredLines: new Set(),
        inBlockComment: false,
        blockCommentContent: '',
    };
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        const lineNumber = i + 1;
        if (state.inBlockComment) {
            processMultiLineBlockCommentContinuation(line, lineNumber, state);
            continue;
        }
        const hasBlockComment = processSingleLineBlockComments(line, lineNumber, state);
        if (!hasBlockComment) {
            processMultiLineBlockCommentStart(line, lineNumber, state);
        }
        processSingleLineComment(line, lineNumber, state);
    }
    return {
        isFileIgnored: state.isFileIgnored,
        ignoredLines: state.ignoredLines,
    };
};

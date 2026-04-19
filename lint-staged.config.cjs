const TEST_FILE_PATTERN = /(^|\/)__tests__\/|\.test\.[jt]sx?$|\.spec\.[jt]sx?$/;

function quoteFile(file) {
  return `'${file.replace(/'/g, `'\\''`)}'`;
}

module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    const sourceFiles = files.filter((file) => !TEST_FILE_PATTERN.test(file));

    if (sourceFiles.length === 0) {
      return [];
    }

    const fileArgs = sourceFiles.map(quoteFile).join(' ');

    return [`prettier --check ${fileArgs}`, `eslint --quiet ${fileArgs}`];
  },
};

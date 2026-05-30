const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');

function run(command) {
  return execSync(command, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function getTags() {
  const output = run('git tag --sort=-creatordate');
  return output ? output.split('\n').filter(Boolean) : [];
}

function getCommitLines(range) {
  const command = range
    ? `git log ${range} --no-merges --date=short --pretty=format:%ad%x09%s`
    : 'git log --no-merges --date=short --pretty=format:%ad%x09%s';
  const output = run(command);
  return output ? output.split('\n').filter(Boolean) : [];
}

function renderSection(title, range) {
  const commits = getCommitLines(range);
  if (commits.length === 0) {
    return `## ${title}\n\n- No user-facing changes recorded.\n`;
  }

  const items = commits
    .map((line) => {
      const [date, subject] = line.split('\t');
      return `- ${subject} (${date})`;
    })
    .join('\n');

  return `## ${title}\n\n${items}\n`;
}

function buildChangelog() {
  const tags = getTags();
  const sections = ['# Changelog', '', 'Generated from git tags and commit history.', ''];

  if (tags.length === 0) {
    sections.push(renderSection('Unreleased', ''));
    return `${sections.join('\n')}\n`;
  }

  sections.push(renderSection('Unreleased', `${tags[0]}..HEAD`));

  tags.slice(0, 20).forEach((tag, index) => {
    const nextTag = tags[index + 1];
    const range = nextTag ? `${nextTag}..${tag}` : tag;
    sections.push('');
    sections.push(renderSection(tag, range));
  });

  return `${sections.join('\n')}\n`;
}

fs.writeFileSync(changelogPath, buildChangelog(), 'utf8');

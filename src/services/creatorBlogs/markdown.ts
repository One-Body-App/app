import type { CreatorBlogValidationErrors } from './types';

const IMAGE_LINE_REGEX = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_URL_REGEX = /(https?:\/\/[^\s<]+)/g;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const applyInlineFormatting = (value: string) => {
  let next = escapeHtml(value);

  next = next.replace(MARKDOWN_LINK_REGEX, '<a href="$2">$1</a>');
  next = next.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
  next = next.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  next = next.replace(/_(.*?)_/g, '<em>$1</em>');
  next = next.replace(/~~(.*?)~~/g, '<del>$1</del>');
  next = next.replace(RAW_URL_REGEX, '<a href="$1">$1</a>');

  return next;
};

export const stripEditorSyntax = (value: string) =>
  value
    .replace(IMAGE_LINE_REGEX, '$1')
    .replace(MARKDOWN_LINK_REGEX, '$1')
    .replace(/<u>(.*?)<\/u>/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^-\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---$/gm, '')
    .replace(RAW_URL_REGEX, '$1');

export const countWords = (value: string) => {
  const plain = stripEditorSyntax(value).replace(/\n/g, ' ').trim();

  if (!plain) {
    return 0;
  }

  return plain.split(/\s+/).filter(Boolean).length;
};

export const estimateReadTimeMinutes = (value: string) => {
  const words = countWords(value);
  return Math.max(1, Math.ceil(words / 220));
};

export const getParagraphs = (value: string) =>
  value.split(/\n{2,}/).flatMap((paragraph) => {
    const trimmed = paragraph.trim();
    return trimmed ? [trimmed] : [];
  });

export const buildPreviewText = (value: string, paragraphCount: number) =>
  getParagraphs(value).slice(0, paragraphCount).join('\n\n');

export const creatorBlogBodyToHtml = (value: string) => {
  const lines = value.split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      return;
    }

    const imageMatch = line.match(IMAGE_LINE_REGEX);
    if (imageMatch) {
      closeList();
      html.push(
        `<figure><img src="${imageMatch[2]}" alt="${escapeHtml(imageMatch[1] || 'Embedded image')}" /></figure>`
      );
      return;
    }

    if (line === '---') {
      closeList();
      html.push('<hr />');
      return;
    }

    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${applyInlineFormatting(line.slice(4))}</h3>`);
      return;
    }

    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${applyInlineFormatting(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${applyInlineFormatting(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith('> ')) {
      closeList();
      html.push(`<blockquote>${applyInlineFormatting(line.slice(2))}</blockquote>`);
      return;
    }

    if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${applyInlineFormatting(line.slice(2))}</li>`);
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${applyInlineFormatting(line.replace(/^\d+\.\s+/, ''))}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${applyInlineFormatting(line)}</p>`);
  });

  closeList();

  return html.join('');
};

export const validateCreatorBlog = ({
  title,
  subtitle,
  coverImage,
  tags,
  body,
}: {
  title: string;
  subtitle: string;
  coverImage: string | null;
  tags: string[];
  body: string;
}): CreatorBlogValidationErrors => {
  const errors: CreatorBlogValidationErrors = {};

  if (!title.trim()) {
    errors.title = 'Add a title before publishing.';
  } else if (title.trim().length > 100) {
    errors.title = 'Titles must be 100 characters or fewer.';
  }

  if (subtitle.trim().length > 250) {
    errors.subtitle = 'Subtitles must be 250 characters or fewer.';
  }

  if (!coverImage) {
    errors.coverImage = 'Choose a cover image before publishing.';
  }

  if (tags.length < 1) {
    errors.tags = 'Select at least one tag.';
  } else if (tags.length > 5) {
    errors.tags = 'Select no more than five tags.';
  }

  if (!stripEditorSyntax(body).trim()) {
    errors.body = 'Write the body of your article before publishing.';
  }

  return errors;
};

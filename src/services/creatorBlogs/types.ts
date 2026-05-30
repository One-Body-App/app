import type { ArticleType, User } from '@/utils/types';

export type CreatorBlogStatus = 'draft' | 'published' | 'archived';
export type CreatorBlogSaveState = 'saved' | 'saving' | 'dirty' | 'error';
export type CreatorBlogPublishState = 'invalid' | 'ready' | 'publishing' | 'published';
export type CreatorBlogInlineFormat =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'bulleted'
  | 'numbered'
  | 'quote'
  | 'link'
  | 'image'
  | 'divider'
  | 'heading1'
  | 'heading2';

export type CreatorBlogAuthor = {
  id: string;
  name: string;
  handle: string;
  profileImage?: string;
  role?: string;
};

export type CreatorBlogRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string | null;
  tags: string[];
  body: string;
  authorId: string;
  author: string;
  authorHandle: string;
  authorProfileImage?: string;
  status: CreatorBlogStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  readCount: number;
  shareCount: number;
  commentCount: number;
  estimatedReadTime: number;
  previewParagraphCount: number;
};

export type CreatorBlogDraftInput = {
  id?: string;
  title: string;
  subtitle: string;
  coverImage: string | null;
  tags: string[];
  body: string;
  status?: CreatorBlogStatus;
};

export type CreatorBlogValidationErrors = {
  title?: string;
  subtitle?: string;
  coverImage?: string;
  tags?: string;
  body?: string;
};

export type CreatorBlogPublishResult = {
  blog: CreatorBlogRecord | null;
  validationErrors: CreatorBlogValidationErrors;
};

export type CreatorBlogSummary = {
  draftCount: number;
  publishedCount: number;
  totalReads: number;
  totalShares: number;
};

export type CreatorBlogSort = 'newest' | 'oldest' | 'most-viewed' | 'last-updated';

export type CreatorBlogFilter = 'all' | 'draft' | 'published' | 'archived';

export type CreatorBlogProfile = User | CreatorBlogAuthor;

export type CreatorBlogArticle = ArticleType & {
  creatorBlog?: true;
  creatorBlogStatus?: CreatorBlogStatus;
  subtitle?: string;
  tags?: string[];
  coverImage?: string | null;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NO_POST_IMAGE_URL } from '@/src/services/constants';
import {
  buildPreviewText,
  countWords,
  estimateReadTimeMinutes,
  validateCreatorBlog,
} from './markdown';
import type {
  CreatorBlogArticle,
  CreatorBlogAuthor,
  CreatorBlogDraftInput,
  CreatorBlogFilter,
  CreatorBlogProfile,
  CreatorBlogPublishResult,
  CreatorBlogRecord,
  CreatorBlogSort,
  CreatorBlogSummary,
} from './types';

const CREATOR_BLOG_STORAGE_KEY = '@onebody/creatorBlogs.v1';
const DEFAULT_PREVIEW_PARAGRAPHS = 3;

type CreatorBlogDependencies = {
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
  now: () => string;
  createId: () => string;
};

const createSlug = (title: string, id: string) => {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `article-${id.slice(-6)}`;
};

const resolveAuthor = (profile: CreatorBlogProfile): CreatorBlogAuthor => {
  if ('handle' in profile) {
    return profile;
  }

  const authorId = String(profile._id || profile.id || profile.userId || '').trim();
  const fallbackHandle = String(profile.username || profile.name || 'creator')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();

  return {
    id: authorId,
    name: String(profile.name || 'Creator').trim() || 'Creator',
    handle: fallbackHandle,
    profileImage: profile.profileImage,
    role: profile.role,
  };
};

const normalizeBlog = (value: unknown): CreatorBlogRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<CreatorBlogRecord>;
  if (typeof item.id !== 'string' || !item.id.trim()) {
    return null;
  }

  return {
    id: item.id,
    slug: typeof item.slug === 'string' ? item.slug : createSlug(String(item.title || ''), item.id),
    title: String(item.title || ''),
    subtitle: String(item.subtitle || ''),
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : null,
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
    body: String(item.body || ''),
    authorId: String(item.authorId || ''),
    author: String(item.author || 'Creator'),
    authorHandle: String(item.authorHandle || 'creator'),
    authorProfileImage:
      typeof item.authorProfileImage === 'string' ? item.authorProfileImage : undefined,
    status:
      item.status === 'published' || item.status === 'archived' || item.status === 'draft'
        ? item.status
        : 'draft',
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || new Date().toISOString()),
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
    readCount: Number(item.readCount || 0),
    shareCount: Number(item.shareCount || 0),
    commentCount: Number(item.commentCount || 0),
    estimatedReadTime: Number(
      item.estimatedReadTime || estimateReadTimeMinutes(String(item.body || ''))
    ),
    previewParagraphCount: Number(item.previewParagraphCount || DEFAULT_PREVIEW_PARAGRAPHS),
  };
};

export const createCreatorBlogService = (dependencies?: Partial<CreatorBlogDependencies>) => {
  const resolvedDependencies: CreatorBlogDependencies = {
    storage: AsyncStorage,
    now: () => new Date().toISOString(),
    createId: () => `blog_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    ...dependencies,
  };

  const readBlogs = async () => {
    const rawValue = await resolvedDependencies.storage.getItem(CREATOR_BLOG_STORAGE_KEY);
    if (!rawValue) {
      return [] as CreatorBlogRecord[];
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalizeBlog).filter(Boolean) as CreatorBlogRecord[];
    } catch {
      return [];
    }
  };

  const writeBlogs = async (blogs: CreatorBlogRecord[]) => {
    await resolvedDependencies.storage.setItem(CREATOR_BLOG_STORAGE_KEY, JSON.stringify(blogs));
  };

  const createSeededBlog = (
    author: CreatorBlogAuthor,
    overrides: Partial<CreatorBlogRecord> & Pick<CreatorBlogRecord, 'id' | 'title' | 'status'>
  ): CreatorBlogRecord => {
    const now = resolvedDependencies.now();
    const baseBody =
      overrides.body ||
      [
        '# Living Faith In Ordinary Days',
        '',
        'The Lord often meets us in the rhythms we think are too small to matter.',
        '',
        'When we slow down enough to listen, ordinary obedience becomes worship.',
        '',
        'https://onebody.com',
      ].join('\n');

    return {
      id: overrides.id,
      slug: overrides.slug || createSlug(overrides.title, overrides.id),
      title: overrides.title,
      subtitle:
        overrides.subtitle ||
        'A reflection on discipleship, consistency, and the grace that keeps shaping us.',
      coverImage:
        overrides.coverImage ||
        'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80',
      tags: overrides.tags || ['Faith', 'Discipleship'],
      body: baseBody,
      authorId: author.id,
      author: author.name,
      authorHandle: author.handle,
      authorProfileImage: author.profileImage,
      status: overrides.status,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      publishedAt: overrides.status === 'published' ? overrides.publishedAt || now : null,
      readCount: overrides.readCount ?? 128,
      shareCount: overrides.shareCount ?? 17,
      commentCount: overrides.commentCount ?? 6,
      estimatedReadTime: overrides.estimatedReadTime || estimateReadTimeMinutes(baseBody),
      previewParagraphCount: overrides.previewParagraphCount || DEFAULT_PREVIEW_PARAGRAPHS,
    };
  };

  const ensureSeededBlogsForAuthor = async (profile: CreatorBlogProfile) => {
    const author = resolveAuthor(profile);
    if (!author.id) {
      return [] as CreatorBlogRecord[];
    }

    const blogs = await readBlogs();
    if (blogs.some((blog) => blog.authorId === author.id)) {
      return blogs;
    }

    const seeded = [
      createSeededBlog(author, {
        id: `${author.id}-seed-published`,
        title: 'Called To Stay Faithful',
        status: 'published',
        publishedAt: resolvedDependencies.now(),
      }),
      createSeededBlog(author, {
        id: `${author.id}-seed-draft`,
        title: 'A Prayer For The Quiet Season',
        status: 'draft',
        coverImage: null,
        body: 'Start your story here...',
        readCount: 0,
        shareCount: 0,
        commentCount: 0,
      }),
    ];
    const next = [...seeded, ...blogs];
    await writeBlogs(next);
    return next;
  };

  const listBlogsForAuthor = async (
    profile: CreatorBlogProfile,
    options?: { filter?: CreatorBlogFilter; search?: string; sort?: CreatorBlogSort }
  ) => {
    const author = resolveAuthor(profile);
    const allBlogs = await ensureSeededBlogsForAuthor(profile);
    const searchTerm = String(options?.search || '')
      .trim()
      .toLowerCase();

    let items = allBlogs.filter((blog) => blog.authorId === author.id);

    if (options?.filter && options.filter !== 'all') {
      items = items.filter((blog) => blog.status === options.filter);
    }

    if (searchTerm) {
      items = items.filter((blog) => {
        return (
          blog.title.toLowerCase().includes(searchTerm) ||
          blog.subtitle.toLowerCase().includes(searchTerm)
        );
      });
    }

    const sort = options?.sort || 'newest';
    items = [...items].sort((left, right) => {
      if (sort === 'oldest') {
        return left.createdAt.localeCompare(right.createdAt);
      }
      if (sort === 'most-viewed') {
        return right.readCount - left.readCount;
      }
      if (sort === 'last-updated') {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      return right.createdAt.localeCompare(left.createdAt);
    });

    return items;
  };

  const getBlogSummary = async (profile: CreatorBlogProfile): Promise<CreatorBlogSummary> => {
    const items = await listBlogsForAuthor(profile);
    return items.reduce(
      (summary, item) => ({
        draftCount: summary.draftCount + (item.status === 'draft' ? 1 : 0),
        publishedCount: summary.publishedCount + (item.status === 'published' ? 1 : 0),
        totalReads: summary.totalReads + item.readCount,
        totalShares: summary.totalShares + item.shareCount,
      }),
      {
        draftCount: 0,
        publishedCount: 0,
        totalReads: 0,
        totalShares: 0,
      }
    );
  };

  const getBlogById = async (blogId: string) => {
    const blogs = await readBlogs();
    return blogs.find((blog) => blog.id === blogId) || null;
  };

  const saveDraft = async (profile: CreatorBlogProfile, input: CreatorBlogDraftInput) => {
    const author = resolveAuthor(profile);
    const blogs = await ensureSeededBlogsForAuthor(profile);
    const now = resolvedDependencies.now();
    const wordCount = countWords(input.body);
    const estimatedReadTime = estimateReadTimeMinutes(input.body);
    const nextId = input.id || resolvedDependencies.createId();

    const existingIndex = blogs.findIndex((blog) => blog.id === input.id);
    const nextRecord: CreatorBlogRecord = {
      id: nextId,
      slug: createSlug(input.title, nextId),
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      coverImage: input.coverImage,
      tags: input.tags.slice(0, 5),
      body: input.body,
      authorId: author.id,
      author: author.name,
      authorHandle: author.handle,
      authorProfileImage: author.profileImage,
      status: input.status || 'draft',
      createdAt: existingIndex >= 0 ? blogs[existingIndex].createdAt : now,
      updatedAt: now,
      publishedAt: existingIndex >= 0 ? blogs[existingIndex].publishedAt : null,
      readCount: existingIndex >= 0 ? blogs[existingIndex].readCount : 0,
      shareCount: existingIndex >= 0 ? blogs[existingIndex].shareCount : 0,
      commentCount: existingIndex >= 0 ? blogs[existingIndex].commentCount : 0,
      estimatedReadTime,
      previewParagraphCount: DEFAULT_PREVIEW_PARAGRAPHS,
    };

    const nextBlogs = [...blogs];
    if (existingIndex >= 0) {
      nextBlogs[existingIndex] = nextRecord;
    } else {
      nextBlogs.unshift(nextRecord);
    }

    await writeBlogs(nextBlogs);
    return { ...nextRecord, estimatedReadTime, wordCount };
  };

  const publishBlog = async (
    profile: CreatorBlogProfile,
    input: CreatorBlogDraftInput
  ): Promise<CreatorBlogPublishResult> => {
    const validationErrors = validateCreatorBlog(input);
    if (Object.keys(validationErrors).length > 0) {
      return {
        blog: null,
        validationErrors,
      };
    }

    const saved = await saveDraft(profile, { ...input, status: 'published' });
    const blogs = await readBlogs();
    const index = blogs.findIndex((blog) => blog.id === saved.id);
    if (index < 0) {
      return { blog: null, validationErrors };
    }

    const now = resolvedDependencies.now();
    const nextBlogs = [...blogs];
    nextBlogs[index] = {
      ...nextBlogs[index],
      status: 'published',
      slug: createSlug(saved.title, saved.id),
      publishedAt: nextBlogs[index].publishedAt || now,
      updatedAt: now,
    };
    await writeBlogs(nextBlogs);

    return { blog: nextBlogs[index], validationErrors: {} };
  };

  const archiveBlog = async (blogId: string) => {
    const blogs = await readBlogs();
    const index = blogs.findIndex((blog) => blog.id === blogId);
    if (index < 0) {
      return null;
    }
    const nextBlogs = [...blogs];
    nextBlogs[index] = {
      ...nextBlogs[index],
      status: 'archived',
      updatedAt: resolvedDependencies.now(),
    };
    await writeBlogs(nextBlogs);
    return nextBlogs[index];
  };

  const deleteDraft = async (blogId: string) => {
    const blogs = await readBlogs();
    const nextBlogs = blogs.filter((blog) => !(blog.id === blogId && blog.status === 'draft'));
    await writeBlogs(nextBlogs);
  };

  const incrementReadCount = async (blogId: string) => {
    const blogs = await readBlogs();
    const index = blogs.findIndex((blog) => blog.id === blogId);
    if (index < 0) {
      return null;
    }

    const nextBlogs = [...blogs];
    nextBlogs[index] = {
      ...nextBlogs[index],
      readCount: nextBlogs[index].readCount + 1,
    };
    await writeBlogs(nextBlogs);
    return nextBlogs[index];
  };

  const toArticleType = (blog: CreatorBlogRecord): CreatorBlogArticle => ({
    id: blog.id,
    link: '',
    created: new Date(blog.publishedAt || blog.updatedAt || blog.createdAt),
    image: { url: blog.coverImage || NO_POST_IMAGE_URL },
    title: blog.title,
    description: blog.subtitle,
    subtitle: blog.subtitle,
    coverImage: blog.coverImage,
    tags: blog.tags,
    creatorBlog: true,
    creatorBlogStatus: blog.status,
    commentNumber: blog.commentCount,
    repostCount: blog.shareCount,
    comments: [],
    reactions: [],
    userData: {
      _id: blog.authorId,
      name: blog.author,
      username: blog.authorHandle,
      accountType: 'individual' as any,
      profileImage: blog.authorProfileImage,
      isApprovedInfluencer: true,
    },
  });

  const listPublishedArticlesForAuthor = async (profile: CreatorBlogProfile) => {
    const items = await listBlogsForAuthor(profile, { filter: 'published', sort: 'newest' });
    return items.map(toArticleType);
  };

  const listRelatedArticles = async (blog: CreatorBlogRecord) => {
    const blogs = await readBlogs();
    return blogs
      .filter(
        (item) =>
          item.status === 'published' && item.id !== blog.id && item.authorId === blog.authorId
      )
      .slice(0, 3);
  };

  const getPreviewBody = (blog: CreatorBlogRecord) =>
    buildPreviewText(blog.body, blog.previewParagraphCount || DEFAULT_PREVIEW_PARAGRAPHS);

  return {
    ensureSeededBlogsForAuthor,
    listBlogsForAuthor,
    listPublishedArticlesForAuthor,
    getBlogSummary,
    getBlogById,
    saveDraft,
    publishBlog,
    archiveBlog,
    deleteDraft,
    incrementReadCount,
    listRelatedArticles,
    getPreviewBody,
    toArticleType,
  };
};

export const creatorBlogService = createCreatorBlogService();

export type { CreatorBlogRecord, CreatorBlogDraftInput } from './types';

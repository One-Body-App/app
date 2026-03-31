import { OrganizationType } from '@/utils/types';

export const ORGANIZATION_CATEGORY_ORDER = [
  'Church',
  'Business',
  'Ministry',
  'Education',
  'Other',
] as const;

export type OrganizationCategoryKey = (typeof ORGANIZATION_CATEGORY_ORDER)[number];

export type OrganizationSubtypeOption = {
  label: string;
  organizationTypeId: string;
};

export type OrganizationCategoryGroup = {
  label: OrganizationCategoryKey;
  value: OrganizationCategoryKey;
  subtypes: OrganizationSubtypeOption[];
};

const CATEGORY_LOOKUP = new Set<OrganizationCategoryKey>(ORGANIZATION_CATEGORY_ORDER);

const CATEGORY_PATTERNS: Array<{
  category: Exclude<OrganizationCategoryKey, 'Other'>;
  patterns: RegExp[];
}> = [
  {
    category: 'Church',
    patterns: [
      /\bchurch\b/,
      /\bchurch plant\b/,
      /\bparish\b/,
      /\bchapel\b/,
      /\bcathedral\b/,
      /\bcongregation\b/,
      /\bdenomination\b/,
      /\bdiocese\b/,
    ],
  },
  {
    category: 'Business',
    patterns: [
      /\bbusiness\b/,
      /\bcompany\b/,
      /\bllc\b/,
      /\binc\b/,
      /\bcorporation\b/,
      /\bcorp\b/,
      /\bfirm\b/,
      /\bagency\b/,
      /\bconsult(ing)?\b/,
      /\bstudio\b/,
      /\bshop\b/,
      /\bstore\b/,
      /\bmarket(place)?\b/,
    ],
  },
  {
    category: 'Ministry',
    patterns: [
      /\bministry\b/,
      /\bministries\b/,
      /\boutreach\b/,
      /\bnon[\s-]?profit\b/,
      /\bcharity\b/,
      /\bfoundation\b/,
      /\borphan(age|age home)?\b/,
      /\bfood bank\b/,
      /\bshelter\b/,
      /\brescue\b/,
      /\bmission(s)?\b/,
      /\bparachurch\b/,
      /\bprison\b/,
      /\bevangel(ism|istic)\b/,
      /\bdiscipleship\b/,
      /\bcampus ministry\b/,
      /\bcommunity service\b/,
    ],
  },
  {
    category: 'Education',
    patterns: [
      /\beducation\b/,
      /\bschool\b/,
      /\bacademy\b/,
      /\bcollege\b/,
      /\buniversity\b/,
      /\bseminary\b/,
      /\binstitute\b/,
      /\btraining\b/,
      /\bdaycare\b/,
    ],
  },
];

export const normalizeOrganizationLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getOrganizationCategoryForLabel = (label: string): OrganizationCategoryKey => {
  const normalizedLabel = normalizeOrganizationLabel(label);
  return (
    CATEGORY_PATTERNS.find(({ patterns }) =>
      patterns.some((pattern) => pattern.test(normalizedLabel))
    )?.category ?? 'Other'
  );
};

export const getOrganizationCategoryForType = (
  organizationType?: Pick<OrganizationType, 'organizationType' | 'name' | 'category'> | null
): OrganizationCategoryKey => {
  const explicitCategory = String(
    organizationType?.category || ''
  ).trim() as OrganizationCategoryKey;

  if (CATEGORY_LOOKUP.has(explicitCategory)) {
    return explicitCategory;
  }

  const label = String(organizationType?.organizationType ?? organizationType?.name ?? '').trim();
  return getOrganizationCategoryForLabel(label);
};

export const buildOrganizationCategoryGroups = (
  organizationTypes: OrganizationType[]
): OrganizationCategoryGroup[] => {
  const grouped = organizationTypes.reduce<
    Map<OrganizationCategoryKey, Map<string, OrganizationSubtypeOption>>
  >(
    (accumulator, item) => {
      const label = (item.organizationType ?? item.name ?? '').trim();

      if (!label || !item._id) {
        return accumulator;
      }

      const category = getOrganizationCategoryForType(item);
      const normalizedLabel = normalizeOrganizationLabel(label);
      const existingItems = accumulator.get(category);

      if (!existingItems || existingItems.has(normalizedLabel)) {
        return accumulator;
      }

      existingItems.set(normalizedLabel, {
        label,
        organizationTypeId: item._id,
      });

      return accumulator;
    },
    new Map(ORGANIZATION_CATEGORY_ORDER.map((category) => [category, new Map()]))
  );

  return ORGANIZATION_CATEGORY_ORDER.map((category) => {
    const values = Array.from(grouped.get(category)?.values() ?? []);
    values.sort((left, right) => left.label.localeCompare(right.label));

    return {
      label: category,
      value: category,
      subtypes: values,
    };
  }).filter((group) => group.subtypes.length > 0);
};

export const getDefaultOrganizationCategory = (
  groups: OrganizationCategoryGroup[]
): OrganizationCategoryKey | '' => {
  const churchGroup = groups.find((group) => group.value === 'Church');
  if (churchGroup) {
    return churchGroup.value;
  }

  return groups[0]?.value ?? '';
};

import { OrganizationType } from '@/utils/types';
import {
  buildOrganizationCategoryGroups,
  getDefaultOrganizationCategory,
  getOrganizationCategoryForLabel,
  getOrganizationCategoryForType,
} from './organizationCategories';

const createOrganizationType = (label: string, id: string): OrganizationType => ({
  _id: id,
  organizationType: label,
});

describe('organizationCategories', () => {
  it('maps ministry-style labels into the ministry category', () => {
    expect(getOrganizationCategoryForLabel('Food Bank')).toBe('Ministry');
    expect(getOrganizationCategoryForLabel('Non-Profit')).toBe('Ministry');
    expect(getOrganizationCategoryForLabel('Outreach Center')).toBe('Ministry');
  });

  it('groups flat organization types into parent categories', () => {
    const groups = buildOrganizationCategoryGroups([
      createOrganizationType('Church', 'church'),
      createOrganizationType('Food Bank', 'food-bank'),
      createOrganizationType('Business', 'business'),
      createOrganizationType('Christian School', 'school'),
      createOrganizationType('Media Network', 'media-network'),
    ]);

    expect(groups).toEqual([
      {
        label: 'Church',
        value: 'Church',
        subtypes: [{ label: 'Church', organizationTypeId: 'church' }],
      },
      {
        label: 'Business',
        value: 'Business',
        subtypes: [{ label: 'Business', organizationTypeId: 'business' }],
      },
      {
        label: 'Ministry',
        value: 'Ministry',
        subtypes: [{ label: 'Food Bank', organizationTypeId: 'food-bank' }],
      },
      {
        label: 'Education',
        value: 'Education',
        subtypes: [{ label: 'Christian School', organizationTypeId: 'school' }],
      },
      {
        label: 'Other',
        value: 'Other',
        subtypes: [{ label: 'Media Network', organizationTypeId: 'media-network' }],
      },
    ]);
  });

  it('defaults to church when that category exists', () => {
    const groups = buildOrganizationCategoryGroups([
      createOrganizationType('Business', 'business'),
      createOrganizationType('Church', 'church'),
    ]);

    expect(getDefaultOrganizationCategory(groups)).toBe('Church');
  });

  it('prefers explicit categories from the backend when present', () => {
    expect(
      getOrganizationCategoryForType({
        _id: 'food-bank',
        organizationType: 'Food Bank',
        category: 'Business',
      })
    ).toBe('Business');
  });
});

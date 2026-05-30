import filterConnectServeJobs from '../serveJobFilters';
import type { ConnectServeJobPublished } from '../types';

const createServeJob = (
  overrides: Partial<ConnectServeJobPublished> & Pick<ConnectServeJobPublished, 'id' | 'title'>
): ConnectServeJobPublished => ({
  id: overrides.id,
  title: overrides.title,
  status: 'published',
  createdAt: overrides.createdAt || '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt || '2026-01-01T00:00:00.000Z',
  publishedAt: overrides.publishedAt || '2026-01-01T00:00:00.000Z',
  visibility: overrides.visibility || 'public',
  hiringStatus: overrides.hiringStatus || 'open',
  lastCompletedStep: overrides.lastCompletedStep ?? 1,
  sector: overrides.sector || '',
  description: overrides.description || '',
  requirements: overrides.requirements || [],
  address: overrides.address || '',
  coordinate: overrides.coordinate || [-84.388, 33.749],
  locationQuery: overrides.locationQuery || '',
  opportunityType: overrides.opportunityType || 'Full-time',
  compensationAmount: overrides.compensationAmount || '',
  compensationFrequency: overrides.compensationFrequency || '',
  applicationMethods: overrides.applicationMethods || [],
  applicationUrl: overrides.applicationUrl || '',
  organizationName: overrides.organizationName || '',
  denomination: overrides.denomination || '',
  applicantCount: overrides.applicantCount ?? 0,
});

describe('filterConnectServeJobs', () => {
  const baseFilters = {
    sort: 'alphabetical' as const,
    roleType: '',
  };

  it('filters by the shared role value stored in title', () => {
    const jobs = [
      createServeJob({ id: '1', title: 'Interim Pastor' }),
      createServeJob({ id: '2', title: 'Drummer' }),
    ];

    const result = filterConnectServeJobs({
      jobs,
      filters: { ...baseFilters, roleType: 'Drummer' },
      quickFilter: 'Hiring',
      searchText: '',
    });

    expect(result.map((job) => job.id)).toEqual(['2']);
  });

  it.each([
    ['Hiring', createServeJob({ id: '1', title: 'Interim Pastor', hiringStatus: 'open' })],
    ['Part-time', createServeJob({ id: '2', title: 'Drummer', opportunityType: 'Part time' })],
    [
      'Full-time',
      createServeJob({ id: '3', title: 'Church Administrator', opportunityType: 'Full-time' }),
    ],
  ] as const)('applies the %s quick filter', (quickFilter, matchingJob) => {
    const nonMatchingJob = createServeJob({
      id: '9',
      title: 'Other Role',
      hiringStatus: quickFilter === 'Hiring' ? 'closed' : 'open',
      opportunityType: quickFilter === 'Part-time' ? 'Full-time' : 'Part-time',
    });

    const result = filterConnectServeJobs({
      jobs: [matchingJob, nonMatchingJob],
      filters: baseFilters,
      quickFilter,
      searchText: '',
    });

    expect(result.map((job) => job.id)).toEqual([matchingJob.id]);
  });

  it('keeps serve opportunities visible when the Serve quick filter is selected', () => {
    const jobs = [
      createServeJob({ id: '1', title: 'Interim Pastor' }),
      createServeJob({ id: '2', title: 'Drummer', hiringStatus: 'closed' }),
    ];

    const result = filterConnectServeJobs({
      jobs,
      filters: baseFilters,
      quickFilter: 'Serve',
      searchText: '',
    });

    expect(result.map((job) => job.id)).toEqual(['2', '1']);
  });

  it('combines search text with role filtering', () => {
    const jobs = [
      createServeJob({
        id: '1',
        title: 'Church Administrator',
        address: 'Atlanta, GA',
      }),
      createServeJob({
        id: '2',
        title: 'Church Administrator',
        address: 'Chicago, IL',
      }),
    ];

    const result = filterConnectServeJobs({
      jobs,
      filters: { ...baseFilters, roleType: 'Church Administrator' },
      quickFilter: 'Hiring',
      searchText: 'atlanta',
    });

    expect(result.map((job) => job.id)).toEqual(['1']);
  });

  it('sorts filtered results by the requested sort order', () => {
    const jobs = [
      createServeJob({
        id: '1',
        title: 'Zebra Role',
        address: 'Atlanta, GA',
      }),
      createServeJob({
        id: '2',
        title: 'Alpha Role',
        address: 'Chicago, IL',
      }),
    ];

    expect(
      filterConnectServeJobs({
        jobs,
        filters: { ...baseFilters, sort: 'alphabetical' },
        quickFilter: 'Hiring',
        searchText: '',
      }).map((job) => job.id)
    ).toEqual(['2', '1']);

    expect(
      filterConnectServeJobs({
        jobs,
        filters: { ...baseFilters, sort: 'nearest_match' },
        quickFilter: 'Hiring',
        searchText: '',
      }).map((job) => job.id)
    ).toEqual(['1', '2']);
  });
});

import type { ConnectServeFilters, ConnectServeJobPublished, ConnectServeQuickChip } from './types';

const normalize = (value: string) => value.trim().toLowerCase();

const normalizeOpportunityType = (value: string) => normalize(value).replace(/[\s_]+/g, '-');

const matchesSearch = (query: string, values: Array<string | undefined>) => {
  if (!query) {
    return true;
  }

  return values.some((value) => normalize(String(value || '')).includes(query));
};

const getServeJobTags = (job: ConnectServeJobPublished) => {
  const tags = ['Serve'];
  if (job.hiringStatus === 'open') {
    tags.push('Hiring');
  }
  return tags;
};

const filterConnectServeJobs = ({
  jobs,
  filters,
  quickFilter,
  searchText,
}: {
  jobs: ConnectServeJobPublished[];
  filters: ConnectServeFilters;
  quickFilter: ConnectServeQuickChip;
  searchText: string;
}) => {
  const searchQuery = normalize(searchText);
  const filtered = jobs.filter((job) => {
    const tags = getServeJobTags(job);

    if (filters.roleType && normalize(job.title) !== normalize(filters.roleType)) {
      return false;
    }

    if (quickFilter === 'Hiring' && job.hiringStatus !== 'open') {
      return false;
    }

    if (
      quickFilter === 'Part-time' &&
      normalizeOpportunityType(job.opportunityType) !== 'part-time'
    ) {
      return false;
    }

    if (
      quickFilter === 'Full-time' &&
      normalizeOpportunityType(job.opportunityType) !== 'full-time'
    ) {
      return false;
    }

    if (quickFilter === 'Serve' && !tags.some((tag) => normalize(tag) === 'serve')) {
      return false;
    }

    return matchesSearch(searchQuery, [job.title, job.address, job.opportunityType, ...tags]);
  });

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'role_type') {
      return left.title.localeCompare(right.title);
    }

    if (filters.sort === 'nearest_match') {
      return left.address.localeCompare(right.address);
    }

    return left.title.localeCompare(right.title);
  });
};

export default filterConnectServeJobs;

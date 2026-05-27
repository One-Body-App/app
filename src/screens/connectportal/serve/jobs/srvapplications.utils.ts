import { formatConnectPortalDate } from '@/src/services/connectPortal';
import type { ConnectServeJobApplicationRecord } from '@/src/services/connectPortal/types';

const CSV_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Location',
  'Submitted At',
  'Resume File Name',
  'Resume URL',
  'Consent Accepted',
  'Testimony',
];

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

const normalizeCsvValue = (value: string | boolean) => {
  if (typeof value === 'boolean') {
    return escapeCsvValue(value ? 'Yes' : 'No');
  }

  return escapeCsvValue(value);
};

export const buildApplicationsCsv = (applications: ConnectServeJobApplicationRecord[]) =>
  [
    CSV_HEADERS.map(escapeCsvValue).join(','),
    ...applications.map((application) =>
      [
        normalizeCsvValue(application.name),
        normalizeCsvValue(application.email),
        normalizeCsvValue(application.phone),
        normalizeCsvValue(application.location),
        normalizeCsvValue(
          application.createdAt
            ? formatConnectPortalDate(String(application.createdAt).slice(0, 10))
            : 'Recently submitted'
        ),
        normalizeCsvValue(application.resumeFileName),
        normalizeCsvValue(application.resumeFileUrl),
        normalizeCsvValue(application.consentAccepted),
        normalizeCsvValue(application.testimony),
      ].join(',')
    ),
  ].join('\n');

export const slugifyJobTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'serve-opportunity';

export const buildApplicationsCsvFileName = (jobTitle: string, now = new Date()) => {
  const isoDate = now.toISOString().slice(0, 10);
  return `applications-${slugifyJobTitle(jobTitle)}-${isoDate}.csv`;
};

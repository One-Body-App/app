import { createConnectServeJobDraft, saveConnectServeJobDraft } from '../index';

const mockApiCall = jest.fn();

jest.mock('@/src/services/api', () => ({
  __esModule: true,
  ApiCall: (...args: any[]) => mockApiCall(...args),
  default: (...args: any[]) => mockApiCall(...args),
}));

describe('serve draft request sanitization', () => {
  beforeEach(() => {
    mockApiCall.mockReset();
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        id: 'serve-draft-1',
        status: 'draft',
        visibility: 'public',
        hiringStatus: 'open',
      },
    });
  });

  it('sends only create-allowed fields when creating a serve draft', async () => {
    await createConnectServeJobDraft({
      visibility: 'private',
      title: 'Interim Pastor',
      description: 'Should not be sent on create',
      requirements: ['Teach'],
      address: '123 Main St',
      locationQuery: '123 Main St',
      lastCompletedStep: 1,
    } as any);

    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'connect/jobs/drafts',
        verb: 'post',
        params: {
          visibility: 'private',
        },
      })
    );
  });

  it('sends only whitelisted update fields and omits invalid blank optionals', async () => {
    await saveConnectServeJobDraft('serve-draft-1', {
      title: '  Interim Pastor  ',
      description: '  Lead weekend services  ',
      requirements: ['  Preach  ', '', ' Shepherd '],
      address: ' 123 Main St ',
      coordinate: [-84.388, 33.749],
      locationQuery: ' 123 Main St ',
      opportunityType: ' Full time ',
      compensationAmount: '   ',
      compensationFrequency: '',
      applicationUrl: '   ',
      lastCompletedStep: 2,
    } as any);

    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'connect/jobs/drafts/serve-draft-1',
        verb: 'patch',
        params: {
          title: 'Interim Pastor',
          description: 'Lead weekend services',
          requirements: ['Preach', 'Shepherd'],
          address: '123 Main St',
          coordinate: [-84.388, 33.749],
          locationQuery: '123 Main St',
          opportunityType: 'Full time',
          lastCompletedStep: 2,
        },
      })
    );
  });
});

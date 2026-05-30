import { submitConnectServeJobApplication } from '../index';

const mockApiCall = jest.fn();

jest.mock('@/src/services/api', () => ({
  __esModule: true,
  ApiCall: (...args: any[]) => mockApiCall(...args),
  default: (...args: any[]) => mockApiCall(...args),
}));

class MockFormData {
  fields: Array<[string, unknown]> = [];

  append(key: string, value: unknown) {
    this.fields.push([key, value]);
  }
}

describe('serve application request payloads', () => {
  beforeEach(() => {
    mockApiCall.mockReset();
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        id: 'application-1',
        jobId: 'job-1',
        ownerUserId: 'owner-1',
        applicantUserId: 'user-1',
        createdAt: '2026-03-31T12:00:00.000Z',
        updatedAt: '2026-03-31T12:00:00.000Z',
        name: 'Nick Building',
        email: 'nick@example.com',
        phone: '+1 404 555 0101',
        location: 'Clarkston, Georgia, United States',
        profilePhotoUri: '',
        testimony: '',
        consentAccepted: true,
        resumeFileName: 'resume.pdf',
        resumeFileUrl: 'https://cdn.example.com/resume.pdf',
        resumeMimeType: 'application/pdf',
      },
    });
    (global as any).FormData = MockFormData;
  });

  it('submits a multipart payload when a resume file is provided', async () => {
    const resumeFile = {
      uri: 'file:///resume.pdf',
      name: 'resume.pdf',
      type: 'application/pdf',
    };

    await submitConnectServeJobApplication('job-1', {
      name: 'Nick Building',
      email: 'Nick@Example.com',
      phone: '+1 404 555 0101',
      location: 'Clarkston, Georgia, United States',
      testimony: 'Called to serve through worship.',
      consentAccepted: true,
      resumeFile,
    });

    const request = mockApiCall.mock.calls[0][0];
    expect(request.route).toBe('connect/jobs/job-1/apply');
    expect(request.verb).toBe('post');
    expect(request.isFormUrlEncode).toBe(true);
    expect(request.params).toBeInstanceOf(MockFormData);
    expect((request.params as MockFormData).fields).toEqual(
      expect.arrayContaining([
        ['name', 'Nick Building'],
        ['email', 'nick@example.com'],
        ['resumeFile', resumeFile],
      ])
    );
  });
});

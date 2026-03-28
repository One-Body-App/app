import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import TicketingTypeScreen from '../create.go.step4';

const mockSaveConnectPortalDraft = jest.fn();
const mockEnsureExistingDraftRecord = jest.fn();
const mockReactNative = jest.requireActual('react-native');

jest.mock('../shared', () => ({
  CreateFlowLayout: ({ title, children, onNext, nextDisabled }: any) => {
    return (
      <mockReactNative.View>
        <mockReactNative.Text>{title}</mockReactNative.Text>
        {children}
        <mockReactNative.TouchableOpacity onPress={onNext} disabled={nextDisabled}>
          <mockReactNative.Text>Next</mockReactNative.Text>
        </mockReactNative.TouchableOpacity>
      </mockReactNative.View>
    );
  },
  ensureExistingDraftRecord: (...args: any[]) => mockEnsureExistingDraftRecord(...args),
  useCreateFlowPalette: jest.fn(() => ({
    textPrimary: '#e6eaec',
    textSecondary: '#9aacb1',
    accent: '#126b87',
    cardActiveBg: 'rgba(18,107,135,0.12)',
    cardBg: '#181a1c',
    cardActiveBorder: '#126b87',
    cardBorder: 'rgba(255,255,255,0.1)',
    inputBg: 'rgba(14,19,26,0.72)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText: '#e6eaec',
    inputPlaceholder: '#9aacb1',
    disabledInputBg: 'rgba(255,255,255,0.04)',
  })),
}));

jest.mock('@/src/services/connectPortal', () => ({
  saveConnectPortalDraft: (...args: any[]) => mockSaveConnectPortalDraft(...args),
}));

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join('');
  }

  if (
    typeof children === 'string' ||
    typeof children === 'number' ||
    typeof children === 'boolean'
  ) {
    return String(children);
  }

  if (React.isValidElement(children)) {
    return flattenText(children.props.children);
  }

  return '';
}

describe('TicketingTypeScreen', () => {
  beforeEach(() => {
    mockSaveConnectPortalDraft.mockReset();
    mockEnsureExistingDraftRecord.mockReset();
    mockEnsureExistingDraftRecord.mockResolvedValue({
      id: 'draft-1',
      ticketType: 'free',
      paymentOption: 'external',
      externalEventUrl: '',
    });
    mockSaveConnectPortalDraft.mockResolvedValue({
      id: 'draft-1',
      ticketType: 'external',
      paymentOption: 'external',
      externalEventUrl: 'https://example.com/register',
    });
  });

  it('renders free gathering, external link, and coming soon paid ticketing copy', async () => {
    const navigation = {
      navigate: jest.fn(),
    };

    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <TicketingTypeScreen
          navigation={navigation as any}
          route={{ params: { draftId: 'draft-1' } } as any}
        />
      );
    });

    const textValues = renderer!.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Free Gathering');
    expect(textValues).toContain('External Link');
    expect(textValues).toContain('One Body Paid Ticketing');
    expect(textValues).toContain('Coming soon');
    expect(textValues).not.toContain('Ticketed Event');
    expect(textValues).not.toContain('Payment Method');
  });

  it('persists external link choice and skips to review', async () => {
    const navigation = {
      navigate: jest.fn(),
    };

    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <TicketingTypeScreen
          navigation={navigation as any}
          route={{ params: { draftId: 'draft-1' } } as any}
        />
      );
    });

    const touchables = renderer!.root.findAllByType(TouchableOpacity);
    const externalOption = touchables.find((node) =>
      flattenText(node.props.children).includes('External Link')
    );

    await act(async () => {
      externalOption?.props.onPress();
    });

    const externalUrlInput = renderer!.root.findByType(TextInput);
    await act(async () => {
      externalUrlInput.props.onChangeText('https://example.com/register');
    });

    const nextButton = renderer!.root
      .findAllByType(TouchableOpacity)
      .find((node) => flattenText(node.props.children) === 'Next');

    await act(async () => {
      nextButton?.props.onPress();
    });

    expect(mockSaveConnectPortalDraft).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({
        ticketType: 'external',
        paymentOption: 'external',
        externalEventUrl: 'https://example.com/register',
      }),
      { completedStep: 4 }
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoCreateStep6Review', {
      draftId: 'draft-1',
    });
  });
});

import { getKeyboardAvoidanceOffset } from '../CustomModal.utils';

describe('getKeyboardAvoidanceOffset', () => {
  it('returns zero when keyboard avoidance is disabled', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: false,
        modalVisible: true,
        keyboardHeight: 260,
        sheetHeight: 420,
        viewportHeight: 900,
      })
    ).toBe(0);
  });

  it('returns zero when the modal is hidden', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: false,
        keyboardHeight: 260,
        sheetHeight: 420,
        viewportHeight: 900,
      })
    ).toBe(0);
  });

  it('moves the sheet by the keyboard height when there is enough room', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: true,
        keyboardHeight: 260,
        sheetHeight: 420,
        viewportHeight: 900,
      })
    ).toBe(260);
  });

  it('clamps the upward shift to the available space above the sheet', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: true,
        keyboardHeight: 320,
        sheetHeight: 760,
        viewportHeight: 900,
      })
    ).toBe(140);
  });

  it('resets to zero when the keyboard height is zero', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: true,
        keyboardHeight: 0,
        sheetHeight: 420,
        viewportHeight: 900,
      })
    ).toBe(0);
  });

  it('reserves room for the status bar and screen header so the sheet never lifts past them', () => {
    // 932pt viewport, 88% sheet, ~336pt keyboard, ~96pt status bar + header.
    // Without the inset the sheet would translate up by 932 - 820 = 112pt and
    // expose space behind the screen header. With the inset the shift is
    // clamped to 932 - 820 - 96 = 16pt.
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: true,
        keyboardHeight: 336,
        sheetHeight: 820,
        viewportHeight: 932,
        safeAreaTopInset: 96,
      })
    ).toBe(16);
  });

  it('returns zero when the sheet already fills past the safe area', () => {
    expect(
      getKeyboardAvoidanceOffset({
        avoidKeyboard: true,
        modalVisible: true,
        keyboardHeight: 336,
        sheetHeight: 900,
        viewportHeight: 932,
        safeAreaTopInset: 96,
      })
    ).toBe(0);
  });
});

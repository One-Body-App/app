export const getKeyboardAvoidanceOffset = ({
  avoidKeyboard,
  modalVisible,
  keyboardHeight,
  sheetHeight,
  viewportHeight,
  safeAreaTopInset = 0,
}: {
  avoidKeyboard: boolean;
  modalVisible: boolean;
  keyboardHeight: number;
  sheetHeight: number;
  viewportHeight: number;
  safeAreaTopInset?: number;
}) => {
  if (!avoidKeyboard || !modalVisible) {
    return 0;
  }

  const safeHeight = Math.max(0, keyboardHeight);
  if (safeHeight === 0) {
    return 0;
  }

  if (sheetHeight <= 0) {
    return safeHeight;
  }

  // The sheet is anchored to the bottom, so viewportHeight - sheetHeight is
  // the empty space above it. safeAreaTopInset reserves room for the status
  // bar + screen header so translating up by the keyboard never lifts the
  // sheet past those elements.
  const availableRoom = Math.max(0, viewportHeight - sheetHeight - safeAreaTopInset);
  return Math.min(safeHeight, availableRoom);
};

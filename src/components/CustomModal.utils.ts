export const getKeyboardAvoidanceOffset = ({
  avoidKeyboard,
  modalVisible,
  keyboardHeight,
  sheetHeight,
  viewportHeight,
}: {
  avoidKeyboard: boolean;
  modalVisible: boolean;
  keyboardHeight: number;
  sheetHeight: number;
  viewportHeight: number;
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

  return Math.min(safeHeight, Math.max(0, viewportHeight - sheetHeight));
};

import validator from './validator';

export const validateFields = async (
  value: string,
  type: string,
  func: (error: string) => void,
  extraFieldData?: Record<string, any>
) => {
  const error = await validator(type, value, extraFieldData);

  func(error || '');
  return error;
};

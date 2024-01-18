import validator from './validator';

export const validateFields = async (
  value: string,
  type: string,

  func: (error: string) => void,
  extraFieldData?: Object
) => {
  const error = await validator(type, value, extraFieldData);

  error ? func(error) : func('');
  return error;
};

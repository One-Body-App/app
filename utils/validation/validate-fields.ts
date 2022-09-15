import validator from './validator';

export const validateFields = async (
  value: string,
  type: string,
  func: (error: string) => void
) => {
  let error = await validator(type, value);

  error ? func(error) : func('');
  return error;
};

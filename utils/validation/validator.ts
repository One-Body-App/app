import validate from 'validate.js';
import validation from './index';

const validator = async (field: string, value: string, extraFieldData?: Record<string, any>) => {
  const lang = 'en';

  let object: Record<string, any> = {};
  object[field] = value;
  if (extraFieldData) {
    object = {
      ...object,
      ...extraFieldData,
    };
  }

  const constraint: Record<string, any> = {};
  constraint[field] = validation(lang)[field];

  // Validate against the constraint and hold the error messages
  let result = validate({}, constraint); //
  if (value !== '' && value != null) {
    result = validate(object, constraint);
  }
  if (result) {
    return result[field][0];
  }

  return null;
};
export default validator;

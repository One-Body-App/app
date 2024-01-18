import validate from 'validate.js';
import { validation } from './index';

const validator = async (field: string, value: string, extraFieldData?: Object) => {
  const lang = 'en';

  let object: any = new Object();
  object[field] = value;
  if (extraFieldData) {
    object = {
      ...object,
      ...extraFieldData,
    };
  }

  const constraint: any = new Object();
  constraint[field] = validation(lang)[field];

  // Validate against the constraint and hold the error messages
  let result = validate({}, constraint); //
  if (value != '' && value != null) {
    result = validate(object, constraint);
  }
  if (result) {
    return result[field][0];
  }

  return null;
};
export default validator;

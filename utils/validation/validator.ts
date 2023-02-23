import { validation } from './index';
import validate from 'validate.js';

const validator = async (field: string, value: string, extraFieldData?: Object) => {
  let lang = 'en';

  let object: any = new Object();
  object[field] = value;
  if (extraFieldData) {
    object = {
      ...object,
      ...extraFieldData,
    };
  }

  let constraint: any = new Object();
  constraint[field] = validation(lang)[field];

  // Validate against the constraint and hold the error messages
  var result = validate({}, constraint); //
  if (value != '' && value != null) {
    console.log(object, constraint);
    result = validate(object, constraint);
  }
  if (result) {
    return result[field][0];
  }

  return null;
};
export default validator;

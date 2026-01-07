// import { arValidation } from './ar-validation'
import { enValidation } from './en-validation';

const validation = (): Record<string, any> => {
  return enValidation as Record<string, any>;
};

export default validation;

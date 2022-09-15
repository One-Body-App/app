// import { arValidation } from './ar-validation'
import { enValidation } from './en-validation';

export const validation = (lang: string): Record<string, any> => {
  return enValidation as Record<string, any>;
};

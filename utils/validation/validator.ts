import validation from './index';

type ValidationConstraint = {
  presence?: { message?: string };
  email?: { message?: string };
  length?: { minimum?: number; message?: string };
  equality?: { attribute?: string; message?: string };
  url?: { message?: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeMessage = (message?: string) =>
  typeof message === 'string' && message.startsWith('^')
    ? message.slice(1)
    : message || 'Invalid value';

const isBlank = (value: string | null | undefined) => value == null || value === '';

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const validator = async (field: string, value: string, extraFieldData?: Record<string, any>) => {
  const rules = validation()[field] as ValidationConstraint | undefined;
  if (!rules) {
    return null;
  }

  const object: Record<string, any> = {
    [field]: value,
    ...(extraFieldData || {}),
  };

  if (isBlank(value)) {
    return rules.presence ? normalizeMessage(rules.presence.message) : null;
  }

  if (rules.email && !EMAIL_REGEX.test(value)) {
    return normalizeMessage(rules.email.message);
  }

  if (rules.length?.minimum && value.length < rules.length.minimum) {
    return normalizeMessage(rules.length.message);
  }

  if (rules.equality?.attribute && value !== object[rules.equality.attribute]) {
    return normalizeMessage(rules.equality.message);
  }

  if (rules.url && !isValidUrl(value)) {
    return normalizeMessage(rules.url.message);
  }

  return null;
};
export default validator;

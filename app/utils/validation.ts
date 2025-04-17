export const isValidAlchemyKey = (key: string | undefined): boolean => {
  if (!key) {
    console.error('No Alchemy key provided');
    return false;
  }

  // Add more detailed validation logging
  const validationChecks = {
    hasValue: !!key,
    notDefault: key !== 'your_actual_api_key',
    noPlaceholder: !key.includes('YOUR_'),
    validLength: key.length >= 30,
    validFormat: /^[a-zA-Z0-9_-]+$/.test(key),
  };

  console.log('Alchemy key validation:', {
    ...validationChecks,
    keyPrefix: key.substring(0, 6) + '...',
  });

  return (
    validationChecks.hasValue &&
    validationChecks.notDefault &&
    validationChecks.noPlaceholder &&
    validationChecks.validLength &&
    validationChecks.validFormat
  );
};

export const isValidAlchemyKey = (key: string | undefined): boolean => {
  if (!key) return false
  if (key === 'your_actual_api_key') return false
  if (key.includes('YOUR_METADATA_HASH')) return false
  if (key.length < 30) return false // Alchemy keys are typically longer
  return true
} 
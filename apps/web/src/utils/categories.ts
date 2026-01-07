/**
 * Default categories available to all users
 */
export const DEFAULT_CATEGORIES = ['Work', 'Personal'] as const;

export type DefaultCategory = typeof DEFAULT_CATEGORIES[number];

/**
 * Validate category name
 * @param category - Category string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateCategory(category: string): string | null {
  if (!category || category.trim().length === 0) {
    return 'Category cannot be empty';
  }

  if (category.trim().length > 50) {
    return 'Category must be 50 characters or less';
  }

  return null;
}

/**
 * Normalize category name (trim whitespace)
 * @param category - Category string to normalize
 * @returns Normalized category or null if empty
 */
export function normalizeCategory(category: string | null | undefined): string | null {
  if (!category) {
    return null;
  }

  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Check if a category is a default category
 * @param category - Category to check
 * @returns True if category is a default category
 */
export function isDefaultCategory(category: string | null): category is DefaultCategory {
  return category !== null && DEFAULT_CATEGORIES.includes(category as DefaultCategory);
}


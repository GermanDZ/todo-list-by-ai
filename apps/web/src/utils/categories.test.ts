import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CATEGORIES,
  validateCategory,
  normalizeCategory,
  isDefaultCategory,
} from './categories.js';

describe('categories', () => {
  describe('DEFAULT_CATEGORIES', () => {
    it('should_contain_work_and_personal', () => {
      expect(DEFAULT_CATEGORIES).toContain('Work');
      expect(DEFAULT_CATEGORIES).toContain('Personal');
    });

    it('should_have_exactly_two_categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(2);
    });
  });

  describe('validateCategory', () => {
    it('should_return_null_for_valid_category', () => {
      expect(validateCategory('Work')).toBeNull();
      expect(validateCategory('Personal')).toBeNull();
      expect(validateCategory('Custom Category')).toBeNull();
    });

    it('should_return_error_for_empty_string', () => {
      const result = validateCategory('');
      expect(result).toBe('Category cannot be empty');
    });

    it('should_return_error_for_whitespace_only', () => {
      const result = validateCategory('   ');
      expect(result).toBe('Category cannot be empty');
    });

    it('should_return_error_for_category_too_long', () => {
      const longCategory = 'a'.repeat(51);
      const result = validateCategory(longCategory);
      expect(result).toBe('Category must be 50 characters or less');
    });

    it('should_return_null_for_exactly_50_characters', () => {
      const exactly50 = 'a'.repeat(50);
      expect(validateCategory(exactly50)).toBeNull();
    });

    it('should_return_error_for_51_characters', () => {
      const tooLong = 'a'.repeat(51);
      const result = validateCategory(tooLong);
      expect(result).toBe('Category must be 50 characters or less');
    });

    it('should_handle_unicode_characters', () => {
      const unicodeCategory = 'カテゴリ';
      expect(validateCategory(unicodeCategory)).toBeNull();
    });
  });

  describe('normalizeCategory', () => {
    it('should_return_null_for_null', () => {
      expect(normalizeCategory(null)).toBeNull();
    });

    it('should_return_null_for_undefined', () => {
      expect(normalizeCategory(undefined)).toBeNull();
    });

    it('should_return_null_for_empty_string', () => {
      expect(normalizeCategory('')).toBeNull();
    });

    it('should_return_null_for_whitespace_only', () => {
      expect(normalizeCategory('   ')).toBeNull();
    });

    it('should_trim_whitespace', () => {
      expect(normalizeCategory('  Work  ')).toBe('Work');
      expect(normalizeCategory('  Personal  ')).toBe('Personal');
    });

    it('should_return_trimmed_category', () => {
      expect(normalizeCategory('Custom Category')).toBe('Custom Category');
      expect(normalizeCategory('  Custom Category  ')).toBe('Custom Category');
    });

    it('should_handle_single_word_with_whitespace', () => {
      expect(normalizeCategory('  Work  ')).toBe('Work');
    });

    it('should_preserve_internal_whitespace', () => {
      expect(normalizeCategory('Custom Category Name')).toBe('Custom Category Name');
    });
  });

  describe('isDefaultCategory', () => {
    it('should_return_true_for_work', () => {
      expect(isDefaultCategory('Work')).toBe(true);
    });

    it('should_return_true_for_personal', () => {
      expect(isDefaultCategory('Personal')).toBe(true);
    });

    it('should_return_false_for_custom_category', () => {
      expect(isDefaultCategory('Custom')).toBe(false);
      expect(isDefaultCategory('Home')).toBe(false);
    });

    it('should_return_false_for_null', () => {
      expect(isDefaultCategory(null)).toBe(false);
    });

    it('should_return_false_for_empty_string', () => {
      expect(isDefaultCategory('')).toBe(false);
    });

    it('should_be_case_sensitive', () => {
      expect(isDefaultCategory('work')).toBe(false);
      expect(isDefaultCategory('WORK')).toBe(false);
      expect(isDefaultCategory('personal')).toBe(false);
      expect(isDefaultCategory('PERSONAL')).toBe(false);
    });

    it('should_return_false_for_whitespace_variations', () => {
      expect(isDefaultCategory(' Work')).toBe(false);
      expect(isDefaultCategory('Work ')).toBe(false);
      expect(isDefaultCategory(' Work ')).toBe(false);
    });
  });
});


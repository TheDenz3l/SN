/**
 * Validation schemas for SwiftNotes forms
 * Using Zod for type-safe validation
 */

import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Setup validation schemas
export const setupSchema = z.object({
  writingStyle: z
    .string()
    .min(10, 'Writing style description must be at least 10 characters')
    .max(500, 'Writing style description must be less than 500 characters'),
  ispTasks: z
    .array(
      z.object({
        description: z
          .string()
          .min(5, 'Task description must be at least 5 characters')
          .max(200, 'Task description must be less than 200 characters'),
      })
    )
    .min(1, 'At least one ISP task is required')
    .max(10, 'Maximum 10 ISP tasks allowed'),
});

// Note generation validation schemas
export const noteGenerationSchema = z.object({
  title: z
    .string()
    .min(1, 'Note title is required')
    .max(100, 'Note title must be less than 100 characters'),
  sections: z
    .array(
      z.object({
        taskId: z.string().optional(),
        prompt: z
          .string()
          .min(10, 'Section prompt must be at least 10 characters')
          .max(500, 'Section prompt must be less than 500 characters'),
        type: z.enum(['task', 'comment', 'general']),
      })
    )
    .min(1, 'At least one section is required')
    .max(20, 'Maximum 20 sections allowed'),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  writingStyle: z
    .string()
    .min(10, 'Writing style description must be at least 10 characters')
    .max(500, 'Writing style description must be less than 500 characters')
    .optional(),
});

// ISP Task validation schema
export const ispTaskSchema = z.object({
  description: z
    .string()
    .min(5, 'Task description must be at least 5 characters')
    .max(200, 'Task description must be less than 200 characters'),
  orderIndex: z.number().min(0).optional(),
});

// Note update validation schema
export const noteUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Note title is required')
    .max(100, 'Note title must be less than 100 characters')
    .optional(),
  content: z.any().optional(),
});

// Export types for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SetupFormData = z.infer<typeof setupSchema>;
export type NoteGenerationFormData = z.infer<typeof noteGenerationSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ISPTaskFormData = z.infer<typeof ispTaskSchema>;
export type NoteUpdateFormData = z.infer<typeof noteUpdateSchema>;

// Validation helper functions
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
};

// Field validation helpers
export const fieldValidators = {
  email: (value: string) => patterns.email.test(value),
  password: (value: string) => value.length >= 6 && patterns.password.test(value),
  required: (value: string) => value.trim().length > 0,
  minLength: (value: string, min: number) => value.length >= min,
  maxLength: (value: string, max: number) => value.length <= max,
};

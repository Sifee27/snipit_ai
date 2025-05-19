/**
 * Input validation middleware using Zod
 * Validates request input against schema definitions
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MAX_CONTENT_LENGTH } from '@/config/constants';

/**
 * Process request schema validator - with lenient validation to support different clients
 */
export const processRequestSchema = z.object({
  // Accept either content or url field
  content: z.string()
    .max(MAX_CONTENT_LENGTH, `Content must be less than ${MAX_CONTENT_LENGTH} characters`)
    .optional(),
    
  url: z.string()
    .url('Invalid URL format')
    .optional(),
    
  contentType: z.enum(['youtube', 'audio', 'video', 'text'], {
    errorMap: () => ({ message: 'Content type must be one of: youtube, audio, video, text' })
  }),
  
  // More flexible options schema that accepts any valid JSON object
  options: z.preprocess(
    // Convert to empty object if null or undefined
    (val) => val === null || val === undefined ? {} : val,
    // Use passthrough() before optional() to allow additional properties
    z.object({
      // Content generation options
      includeSummary: z.boolean().optional(),
      includeKeyQuotes: z.boolean().optional(),
      includeSocialPost: z.boolean().optional(),
      includeBlogPost: z.boolean().optional(),
        
      // Old style options - preserved for compatibility
      maxSummaryLength: z.number()
        .int()
        .min(50)
        .max(500)
        .optional(),
        
      maxQuotes: z.number()
        .int()
        .min(1)
        .max(10)
        .optional(),
        
      includeTimestamps: z.boolean().optional(),
      
      socialTone: z.enum(['professional', 'casual', 'friendly'])
        .optional(),
        
      generateBlog: z.boolean().optional(),
      
      // Allow additional properties
      sourceUrl: z.string().optional()
    }).passthrough().optional()
  ).optional()
}).refine(
  // Ensure either content or url is provided
  data => {
    const hasContent = !!data.content;
    const hasUrl = !!data.url;
    console.log('Validation refinement check:', { hasContent, hasUrl, data });
    return hasContent || hasUrl;
  },
  {
    message: 'Either content or url must be provided',
    path: ['content']
  }
);

/**
 * Auth request schema validator
 */
export const authRequestSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
    
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long')
});

/**
 * Registration request schema validator
 */
export const registerRequestSchema = authRequestSchema.extend({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
});

/**
 * Generic validation middleware creator
 * @param schema - Zod schema to validate against
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return async function validate(
    req: NextRequest,
    handler: (req: NextRequest, validData: T) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      let body;
      
      try {
        body = await req.json();
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
      
      console.log('Validating request body:', body);
      const result = schema.safeParse(body);
      
      if (!result.success) {
        const { errors } = result.error;
        
        // Log detailed validation errors for debugging
        console.error('Validation failed with errors:', 
          errors.map(e => ({ path: e.path.join('.'), message: e.message })));
        
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }
      
      return handler(req, result.data);
    } catch (error) {
      console.error('Validation error:', error);
      
      return NextResponse.json(
        { success: false, error: 'Internal server error during validation' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate process request middleware
 */
export const validateProcessRequest = createValidator(processRequestSchema);

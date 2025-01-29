import {
  originalDataSchema,
  aiAnalysisResultsSchema,
} from "../validations/quote";
import { ZodError } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues?: { path: (string | number)[]; message: string }[];
  };
}

export async function validateQuoteData(quote: {
  originalData: unknown;
  results: unknown;
}): Promise<{
  originalData: ValidationResult<unknown>;
  results: ValidationResult<unknown>;
}> {
  const validationResults = {
    originalData: { success: false } as ValidationResult<unknown>,
    results: { success: false } as ValidationResult<unknown>,
  };

  try {
    if (quote.originalData) {
      const parsedOriginalData = await originalDataSchema.parseAsync(
        quote.originalData
      );
      validationResults.originalData = {
        success: true,
        data: parsedOriginalData,
      };
    } else {
      validationResults.originalData = {
        success: false,
        error: {
          message: "Original data is missing",
        },
      };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      validationResults.originalData = {
        success: false,
        error: {
          message: "Invalid original data format",
          issues: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
      };
    } else {
      validationResults.originalData = {
        success: false,
        error: {
          message: "Failed to validate original data",
        },
      };
    }
  }

  try {
    if (quote.results) {
      const parsedResults = await aiAnalysisResultsSchema.parseAsync(
        quote.results
      );
      validationResults.results = {
        success: true,
        data: parsedResults,
      };
    } else {
      validationResults.results = {
        success: false,
        error: {
          message: "Analysis results are missing",
        },
      };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      validationResults.results = {
        success: false,
        error: {
          message: "Invalid analysis results format",
          issues: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
      };
    } else {
      validationResults.results = {
        success: false,
        error: {
          message: "Failed to validate analysis results",
        },
      };
    }
  }

  return validationResults;
}

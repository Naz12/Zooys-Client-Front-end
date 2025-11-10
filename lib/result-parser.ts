/**
 * Universal Result Parser for Different Summarization Tools
 * 
 * This utility handles the various response structures returned by different tools:
 * - Text summarization (direct structure)
 * - YouTube summarization (nested with bundle/ai_result)
 * - File summarization (nested with metadata)
 * - PDF summarization (nested with file_info)
 */

export interface ParsedSummaryResult {
  summary: string;
  key_points?: string[];
  confidence_score?: number;
  model_used?: string;
  metadata?: any;
  source_info?: any;
  ai_result?: any;
  bundle?: any;
  file_info?: any;
  raw_result?: any; // Keep original for debugging
}

/**
 * Universal result parser that handles all different response structures
 */
export function parseSummarizationResult(result: any): ParsedSummaryResult | null {
  console.log('🔍 Parsing result structure:', result);
  console.log('🔍 Result type:', typeof result);
  console.log('🔍 Result keys:', result ? Object.keys(result) : 'null');
  
  // Handle null/undefined results
  if (!result) {
    console.log('❌ No result provided');
    return null;
  }

  // Structure 1: Direct structure (your text summarization case)
  if (result.summary && result.key_points) {
    console.log('✅ Found direct structure (text summarization)');
    // Extract model_used from metadata if not at top level
    const modelUsed = result.model_used || result.metadata?.model_used || 'unknown';
    return {
      summary: result.summary,
      key_points: result.key_points,
      confidence_score: result.confidence_score,
      model_used: modelUsed,
      metadata: result.metadata,
      raw_result: result
    };
  }

  // Structure 2: Nested in result.data
  if (result.data) {
    console.log('✅ Found result.data structure');
    const data = result.data;
    
    // Text summarization in data
    if (data.summary && data.key_points) {
      console.log('✅ Found text summarization in data');
      console.log('🔍 Data summary:', data.summary);
      console.log('🔍 Data key_points:', data.key_points);
      console.log('🔍 Data confidence_score:', data.confidence_score);
      console.log('🔍 Data model_used:', data.model_used);
      return {
        summary: data.summary,
        key_points: data.key_points,
        confidence_score: data.confidence_score,
        model_used: data.model_used,
        metadata: data.metadata,
        source_info: data.source_info,
        raw_result: result
      };
    }
    
    // YouTube summarization (has bundle or ai_result)
    if (data.bundle || data.ai_result) {
      console.log('✅ Found YouTube summarization in data');
      return {
        summary: data.summary || data.bundle?.summary || data.ai_result?.summary || 'YouTube summary available',
        key_points: data.key_points || [],
        confidence_score: data.bundle?.meta?.ai_confidence_score || data.metadata?.[0]?.confidence || 0.8,
        model_used: data.bundle?.meta?.ai_model_used || data.metadata?.[0]?.model_used || 'unknown',
        metadata: data.metadata,
        ai_result: data.ai_result,
        bundle: data.bundle,
        raw_result: result
      };
    }
    
    // File summarization (has file_info)
    if (data.file_info) {
      console.log('✅ Found file summarization in data');
      return {
        summary: data.summary || 'File summary available',
        key_points: data.key_points || [],
        confidence_score: data.confidence_score || 0.8,
        model_used: data.model_used || 'unknown',
        file_info: data.file_info,
        metadata: data.metadata,
        raw_result: result
      };
    }
    
    // Simple summary in data
    if (data.summary) {
      console.log('✅ Found simple summary in data');
      return {
        summary: data.summary,
        key_points: data.key_points || [],
        confidence_score: data.confidence_score || 0.8,
        model_used: data.model_used || 'unknown',
        metadata: data.metadata,
        source_info: data.source_info,
        raw_result: result
      };
    }
  }

  // Structure 3: Nested in result.result
  if (result.result) {
    console.log('✅ Found result.result structure');
    const resultData = result.result;
    
    if (resultData.summary) {
      console.log('✅ Found summary in result.result');
      return {
        summary: resultData.summary,
        key_points: resultData.key_points || [],
        confidence_score: resultData.confidence_score || 0.8,
        model_used: resultData.model_used || 'unknown',
        metadata: resultData.metadata,
        source_info: resultData.source_info,
        raw_result: result
      };
    }
  }

  // Structure 4: Legacy format (backward compatibility)
  if (result.summary && !result.key_points) {
    console.log('✅ Found legacy summary format');
    return {
      summary: result.summary,
      key_points: [],
      confidence_score: result.confidence_score || 0.8,
      model_used: result.model_used || 'unknown',
      metadata: result.metadata,
      source_info: result.source_info,
      raw_result: result
    };
  }

  // Structure 5: Error handling
  if (result.error) {
    console.log('❌ Found error in result:', result.error);
    return {
      summary: `Error: ${result.error}`,
      key_points: [],
      confidence_score: 0,
      model_used: 'error',
      raw_result: result
    };
  }

  // Fallback: Try to extract any summary-like content
  console.log('⚠️ No recognized structure found, attempting fallback extraction');
  
  // Look for summary in various possible locations
  const possibleSummaries = [
    result.summary,
    result.data?.summary,
    result.result?.summary,
    result.data?.bundle?.summary,
    result.data?.ai_result?.summary
  ].filter(Boolean);

  if (possibleSummaries.length > 0) {
    console.log('✅ Found summary in fallback extraction');
    return {
      summary: possibleSummaries[0],
      key_points: result.key_points || result.data?.key_points || [],
      confidence_score: result.confidence_score || result.data?.confidence_score || 0.8,
      model_used: result.model_used || result.data?.model_used || 'unknown',
      raw_result: result
    };
  }

  console.log('❌ No summary found in any structure');
  return null;
}

/**
 * Get a user-friendly display message for the result
 */
export function getResultDisplayMessage(parsedResult: ParsedSummaryResult | null): string {
  if (!parsedResult) {
    return "No summary found";
  }

  if (parsedResult.summary.startsWith('Error:')) {
    return parsedResult.summary;
  }

  if (parsedResult.summary && parsedResult.summary.length > 0) {
    return "Summary generated successfully";
  }

  return "Summary available";
}

/**
 * Get result type for display purposes
 */
export function getResultType(parsedResult: ParsedSummaryResult | null): string {
  if (!parsedResult) {
    return "unknown";
  }

  if (parsedResult.bundle) {
    return "YouTube Video";
  }

  if (parsedResult.file_info) {
    return "File Document";
  }

  if (parsedResult.ai_result) {
    return "AI Generated";
  }

  return "Text Summary";
}

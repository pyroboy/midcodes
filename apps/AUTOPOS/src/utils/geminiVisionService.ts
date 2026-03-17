import { Product } from "@/types/sales";
import { MOCK_PRODUCTS } from "@/data/mockData";

// Gemini API configuration
const API_KEY = "AIzaSyAIG4L1GrK5i-ZIIo1fHv2PkR57jXQEB3s";
// Updated to use gemini-1.5-flash instead of the deprecated gemini-pro-vision
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Confidence threshold for product recognition
export const CONFIDENCE_THRESHOLD = 0.65;

// Types for Gemini API responses
interface GeminiAnalysisResult {
  isProduct: boolean;
  isAutoPart: boolean;
  confidence: number;
  productType?: string;
  description?: string;
  possibleMatches?: string[];
  brand?: string;
  model?: string;
  relatedProductTypes?: string[];
}

export const analyzeImageWithGemini = async (imageBase64: string): Promise<GeminiAnalysisResult> => {
  // Remove data URL prefix if present
  const base64Data = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64;
  
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and determine if it's an automotive part or accessory with high precision. 
                Look for specific characteristics that identify it as a vehicle component.
                
                If it is an automotive part, provide the following information in JSON format:
                {
                  "isProduct": true,
                  "isAutoPart": true,
                  "confidence": 0.0-1.0,
                  "productType": "specific category name (e.g., brake pad, air filter, spark plug)",
                  "brand": "specific brand name if visible (e.g., Bosch, ACDelco, NGK)",
                  "model": "specific model name or number if visible",
                  "description": "detailed description including vehicle compatibility if visible",
                  "possibleMatches": ["specific part names or numbers if visible"],
                  "relatedProductTypes": ["list of 3-5 related product types that are often used with this part"]
                }
                
                Prioritize identifying the brand name. If you're uncertain about the brand, reduce the overall confidence score appropriately.
                Be very precise with product type naming - an ignition coil is different from a spark plug, a timing belt is different from a serpentine belt, etc.
                
                If it's a product but NOT an automotive part, return:
                {
                  "isProduct": true,
                  "isAutoPart": false,
                  "confidence": 0.0-1.0,
                  "productType": "what type of product it is",
                  "brand": "brand name if visible",
                  "description": "brief description",
                  "relatedProductTypes": ["list of 3-5 related product types"]
                }
                
                If it's not a product at all or you're unsure, still provide your best guess at what it might be:
                {
                  "isProduct": false,
                  "isAutoPart": false,
                  "confidence": 0.0-1.0,
                  "productType": "your best guess at what this might be, even if it's not a product"
                }
                
                Give me ONLY the JSON response, nothing else. Always include a productType field with your best guess, even if confidence is very low.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status}`, await response.text());
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract JSON response from text
    const textResponse = data.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response:", textResponse);
    
    const jsonStartIndex = textResponse.indexOf('{');
    const jsonEndIndex = textResponse.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("Could not parse JSON response");
    }
    
    const jsonResponse = textResponse.substring(jsonStartIndex, jsonEndIndex);
    const result = JSON.parse(jsonResponse) as GeminiAnalysisResult;
    
    // If it's an auto part but brand is missing, undefined, or "unknown", reduce confidence significantly
    if (result.isAutoPart) {
      if (!result.brand || result.brand === "unknown" || result.brand.toLowerCase() === "unknown") {
        // Reduce confidence by 40% if no brand is identified for auto parts
        result.confidence = Math.max(0.1, result.confidence * 0.6);
        console.log("Confidence reduced due to missing brand identification:", result.confidence);
      } else if (!result.model) {
        // Reduce confidence by 20% if brand is identified but no model
        result.confidence = Math.max(0.2, result.confidence * 0.8);
        console.log("Confidence slightly reduced due to missing model:", result.confidence);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing image:", error);
    // Return default result on error
    return {
      isProduct: false,
      isAutoPart: false,
      confidence: 0,
      productType: "Unknown (Error occurred)"
    };
  }
};

// Calculate string similarity score (0-1) using Levenshtein distance
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // If either string is empty, similarity is 0
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // If strings are identical, similarity is 1
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity as 1 - normalized distance
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
};

export const findMatchingProducts = (analysisResult: GeminiAnalysisResult): Product[] => {
  if (!analysisResult.isProduct || !analysisResult.productType) {
    return [];
  }

  let brandMatches: Product[] = [];
  let typeMatches: Product[] = [];
  let relatedMatches: Product[] = [];
  
  // First priority: find products matching the brand if available
  if (analysisResult.brand && analysisResult.brand.toLowerCase() !== "unknown") {
    brandMatches = MOCK_PRODUCTS.filter(product => 
      product.manufacturer?.toLowerCase().includes(analysisResult.brand!.toLowerCase()) ||
      product.name.toLowerCase().includes(analysisResult.brand!.toLowerCase())
    );
  }
  
  // Second priority: find products matching the productType
  typeMatches = MOCK_PRODUCTS.filter(product => 
    product.category.toLowerCase().includes(analysisResult.productType!.toLowerCase()) ||
    product.name.toLowerCase().includes(analysisResult.productType!.toLowerCase())
  );

  // If we have possible part names, use them to refine the search
  let specificMatches: Product[] = [];
  if (analysisResult.possibleMatches && analysisResult.possibleMatches.length > 0) {
    specificMatches = MOCK_PRODUCTS.filter(product => 
      analysisResult.possibleMatches!.some(match => 
        product.name.toLowerCase().includes(match.toLowerCase()) ||
        product.description.toLowerCase().includes(match.toLowerCase())
      )
    );
  }
  
  // Find products related to this productType
  if (analysisResult.relatedProductTypes && analysisResult.relatedProductTypes.length > 0) {
    relatedMatches = MOCK_PRODUCTS.filter(product => 
      analysisResult.relatedProductTypes!.some(relatedType => 
        product.category.toLowerCase().includes(relatedType.toLowerCase()) ||
        product.name.toLowerCase().includes(relatedType.toLowerCase())
      )
    );
  }
  
  // Combine all matches and remove duplicates
  let allMatches = [...new Set([...brandMatches, ...typeMatches, ...specificMatches])];
  
  // If no matches found, search more broadly by keywords
  if (allMatches.length === 0 && analysisResult.productType) {
    // Split the product type into individual words and search for each
    const keywords = [
      ...(analysisResult.productType?.toLowerCase().split(/\s+/) || []),
      ...(analysisResult.brand?.toLowerCase().split(/\s+/) || [])
    ];
    
    // Try to find any products that contain any of these keywords
    allMatches = MOCK_PRODUCTS.filter(product => 
      keywords.some(keyword => 
        keyword.length > 2 && (
          product.name.toLowerCase().includes(keyword) ||
          product.description.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword) ||
          product.manufacturer?.toLowerCase().includes(keyword)
        )
      )
    );
  }

  // Sort by product name match first, then by brand match, then by type match
  return allMatches.sort((a, b) => {
    // Calculate name similarity scores for both products
    const aNameSimilarity = calculateStringSimilarity(a.name, analysisResult.productType || "");
    const bNameSimilarity = calculateStringSimilarity(b.name, analysisResult.productType || "");
    
    // Significant difference in name similarity - this is highest priority
    if (Math.abs(aNameSimilarity - bNameSimilarity) > 0.3) {
      return bNameSimilarity - aNameSimilarity;
    }
    
    // Second priority: brand match
    if (analysisResult.brand) {
      const aBrandMatch = a.manufacturer?.toLowerCase().includes(analysisResult.brand.toLowerCase()) || 
                          a.name.toLowerCase().includes(analysisResult.brand.toLowerCase());
      const bBrandMatch = b.manufacturer?.toLowerCase().includes(analysisResult.brand.toLowerCase()) || 
                          b.name.toLowerCase().includes(analysisResult.brand.toLowerCase());
      
      if (aBrandMatch && !bBrandMatch) return -1;
      if (!aBrandMatch && bBrandMatch) return 1;
    }
    
    // Third priority: product type match
    const aTypeMatch = a.category === analysisResult.productType;
    const bTypeMatch = b.category === analysisResult.productType;
    
    if (aTypeMatch && !bTypeMatch) return -1;
    if (!aTypeMatch && bTypeMatch) return 1;
    
    // Fourth priority: part number matches
    if (analysisResult.possibleMatches) {
      const aPartMatch = analysisResult.possibleMatches.some(match => 
        a.name.toLowerCase().includes(match.toLowerCase()) || 
        a.sku.toLowerCase().includes(match.toLowerCase()));
      const bPartMatch = analysisResult.possibleMatches.some(match => 
        b.name.toLowerCase().includes(match.toLowerCase()) || 
        b.sku.toLowerCase().includes(match.toLowerCase()));
      
      if (aPartMatch && !bPartMatch) return -1;
      if (!aPartMatch && bPartMatch) return 1;
    }
    
    // Fall back to existing name similarity as a tiebreaker
    return bNameSimilarity - aNameSimilarity;
  }).concat(
    // Add related products at the end, but only if they're not already in the matches
    relatedMatches.filter(relatedProduct => 
      !allMatches.some(match => match.id === relatedProduct.id)
    )
  );
};

// Identify which products are direct matches vs related products
export const categorizeProducts = (
  products: Product[], 
  analysisResult: GeminiAnalysisResult | null
): { directMatches: Product[], relatedMatches: Product[] } => {
  if (!products.length || !analysisResult || !analysisResult.productType) {
    return { directMatches: [], relatedMatches: [] };
  }
  
  // First identify direct matches based on product type
  const directMatches = products.filter(product => {
    // Check if product name or category directly matches the identified product type
    const nameMatch = calculateStringSimilarity(product.name, analysisResult.productType || "") > 0.6;
    const categoryMatch = product.category.toLowerCase() === analysisResult.productType?.toLowerCase();
    const specificPartMatch = analysisResult.possibleMatches?.some(match => 
      product.name.toLowerCase().includes(match.toLowerCase()) || 
      product.sku.toLowerCase().includes(match.toLowerCase()));
    
    return nameMatch || categoryMatch || specificPartMatch;
  });
  
  // Any remaining products are considered related
  const relatedMatches = products.filter(
    product => !directMatches.some(match => match.id === product.id)
  );
  
  return { directMatches, relatedMatches };
};

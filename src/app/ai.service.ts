import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { UserProfile, ScanAnalysis } from './models';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private _ai: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    if (!this._ai) {
      if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not defined. Please check your environment variables.');
      }
      this._ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
    return this._ai;
  }

  async analyzeProduct(imageBase64: string, userProfile: UserProfile | null): Promise<{ productName: string, category: string, analysis: ScanAnalysis }> {
    const model = 'gemini-3-flash-preview';
    
    const userContext = userProfile ? `
      The user has the following dietary profile:
      Diet: ${userProfile.preferences.diet}
      Allergies: ${userProfile.preferences.allergies.join(', ') || 'None'}
      Goals: ${userProfile.preferences.goals.join(', ') || 'None'}
      Health Conditions: ${userProfile.preferences.healthConditions.join(', ') || 'None'}
    ` : 'No specific user profile provided.';

    const prompt = `
      Analyze this product from the image. 
      Identify the product name and if it is food, beverage, personal-care, or household item.
      
      For FOOD/BEVERAGE:
      - Extract nutrition facts (calories, fats, proteins, sugars, sodium).
      - Extract ingredients list.
      - Evaluate if this is a "Good Match" based on the user's profile: ${userContext}.
      - Give it a health score from 1-100.
      - Provide a summary and a clear recommendation (Buy/Avoid/Limit).
      - List any warnings (e.g. allergens found, high sugar).

      For NON-FOOD:
      - Evaluate if it's a good buy based on user needs.
      - Identify key ingredients or features.
      
      Return response in valid JSON.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['food', 'beverage', 'personal-care', 'household', 'other'] },
              analysis: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  isGoodMatch: { type: Type.BOOLEAN },
                  recommendation: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                  nutritionInfo: { type: Type.OBJECT, properties: {
                    calories: { type: Type.STRING },
                    sugar: { type: Type.STRING },
                    protein: { type: Type.STRING },
                    fat: { type: Type.STRING },
                    sodium: { type: Type.STRING }
                  }}
                },
                required: ['summary', 'isGoodMatch', 'recommendation', 'score']
              }
            },
            required: ['productName', 'category', 'analysis']
          }
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      return result;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze product. Please try again.');
    }
  }
}

import { OpenAI } from 'openai';
import { prisma } from '../server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate ride price based on distance, time, and market conditions
 * Uses a combination of base pricing and AI-powered dynamic pricing
 * 
 * @param distance Distance in kilometers
 * @param vehicleType Optional vehicle type (defaults to STANDARD)
 * @returns Calculated price in CDF (Congolese Francs)
 */
export const calculatePrice = async (
  distance: number, 
  vehicleType: 'STANDARD' | 'PREMIUM' | 'SUV' | 'MOTO' = 'STANDARD'
): Promise<number> => {
  try {
    // Get pricing configuration from database
    const pricingConfig = await getPricingConfig();
    
    // Base calculation
    let basePrice = calculateBasePrice(distance, vehicleType, pricingConfig);
    
    // Apply AI dynamic pricing if available
    if (process.env.ENABLE_AI_PRICING === 'true' && process.env.OPENAI_API_KEY) {
      try {
        const dynamicFactor = await getDynamicPricingFactor(distance, vehicleType);
        basePrice = Math.round(basePrice * dynamicFactor);
      } catch (error) {
        console.error('Error in AI dynamic pricing:', error);
        // Continue with base price if AI pricing fails
      }
    }
    
    return basePrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    // Fallback to simple calculation if anything fails
    return calculateFallbackPrice(distance, vehicleType);
  }
};

/**
 * Get pricing configuration from database or use defaults
 */
const getPricingConfig = async () => {
  // In a real implementation, this would fetch from database
  // For now, using hardcoded values
  return {
    baseRates: {
      STANDARD: {
        baseFare: 5000, // CDF
        perKm: 1000,    // CDF per kilometer
        perMinute: 100  // CDF per minute
      },
      PREMIUM: {
        baseFare: 8000,
        perKm: 1500,
        perMinute: 150
      },
      SUV: {
        baseFare: 10000,
        perKm: 2000,
        perMinute: 200
      },
      MOTO: {
        baseFare: 3000,
        perKm: 800,
        perMinute: 80
      }
    },
    minimumFare: {
      STANDARD: 5000,
      PREMIUM: 8000,
      SUV: 10000,
      MOTO: 3000
    },
    surgeMultiplier: 1.0, // Default no surge
    timeMultipliers: {
      // Higher rates during peak hours
      morning: 1.2,  // 7-9 AM
      evening: 1.3,  // 5-7 PM
      night: 1.5,    // 10 PM - 5 AM
      normal: 1.0    // Regular hours
    }
  };
};

/**
 * Calculate base price using standard formula
 */
const calculateBasePrice = (
  distance: number, 
  vehicleType: string,
  pricingConfig: any
): number => {
  const rates = pricingConfig.baseRates[vehicleType];
  const minimumFare = pricingConfig.minimumFare[vehicleType];
  
  // Estimate time based on distance (assuming average speed of 30 km/h)
  const estimatedMinutes = Math.round((distance / 30) * 60);
  
  // Apply time-based multiplier
  const hour = new Date().getHours();
  let timeMultiplier = pricingConfig.timeMultipliers.normal;
  
  if (hour >= 7 && hour < 9) {
    timeMultiplier = pricingConfig.timeMultipliers.morning;
  } else if (hour >= 17 && hour < 19) {
    timeMultiplier = pricingConfig.timeMultipliers.evening;
  } else if (hour >= 22 || hour < 5) {
    timeMultiplier = pricingConfig.timeMultipliers.night;
  }
  
  // Calculate price components
  const distanceCharge = rates.perKm * distance;
  const timeCharge = rates.perMinute * estimatedMinutes;
  const calculatedPrice = Math.round((rates.baseFare + distanceCharge + timeCharge) * timeMultiplier);
  
  // Apply surge multiplier if active
  const withSurge = Math.round(calculatedPrice * pricingConfig.surgeMultiplier);
  
  // Ensure minimum fare
  return Math.max(withSurge, minimumFare);
};

/**
 * Get dynamic pricing factor using AI
 */
const getDynamicPricingFactor = async (
  distance: number,
  vehicleType: string
): Promise<number> => {
  try {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    // Get current weather (mock data - would be from a weather API)
    const weather = 'normal'; // Could be 'rainy', 'normal', etc.
    
    // Get current demand (mock data - would be from database)
    const currentDemand = 'medium'; // Could be 'low', 'medium', 'high'
    
    // Prepare prompt for OpenAI
    const prompt = `
      Calculate a fair dynamic pricing factor for a taxi ride in Kinshasa, DRC with the following parameters:
      - Distance: ${distance} km
      - Vehicle type: ${vehicleType}
      - Current hour: ${currentHour}
      - Is weekend: ${isWeekend}
      - Weather: ${weather}
      - Current demand: ${currentDemand}
      
      Consider factors like time of day, weather conditions, and current demand.
      Return only a single number between 0.8 and 2.0 representing the pricing multiplier.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a pricing algorithm for a taxi service in Kinshasa, DRC. Respond only with a number." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 10
    });
    
    const factor = parseFloat(response.choices[0].message.content?.trim() || "1.0");
    
    // Ensure factor is within reasonable bounds
    return Math.min(Math.max(factor, 0.8), 2.0);
  } catch (error) {
    console.error('Error in dynamic pricing:', error);
    return 1.0; // Default to no adjustment
  }
};

/**
 * Fallback price calculation if main calculation fails
 */
const calculateFallbackPrice = (
  distance: number, 
  vehicleType: string
): number => {
  // Simple calculation based on vehicle type and distance
  const baseRates = {
    STANDARD: 1000,
    PREMIUM: 1500,
    SUV: 2000,
    MOTO: 800
  };
  
  const baseFare = {
    STANDARD: 5000,
    PREMIUM: 8000,
    SUV: 10000,
    MOTO: 3000
  };
  
  // @ts-ignore
  return baseFare[vehicleType] + Math.round(baseRates[vehicleType] * distance);
};

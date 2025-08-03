// API Configuration
export const config = {
  // In development, use localhost. In production, use relative URLs
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? '/api/v1'  // Use relative URL in production (proxy)
    : 'http://localhost:8000/api/v1', // Use localhost in development
  
  // Fallback for server-side rendering
  fallbackApiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
};

// Get the appropriate API URL
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return config.apiBaseUrl;
  }
  return config.fallbackApiUrl;
}; 
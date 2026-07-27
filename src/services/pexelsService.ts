export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export async function searchGamingPhotos(query: string = "gaming", perPage: number = 15): Promise<PexelsPhoto[]> {
  try {
    const response = await fetch(`/api/pexels/search?query=${encodeURIComponent(query)}&per_page=${perPage}`);
    
    if (!response.ok) {
      return [];
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos;
  } catch {
    return [];
  }
}

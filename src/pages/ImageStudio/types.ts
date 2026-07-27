export interface GenerationHistoryItem {
  id?: string;
  url: string;
  title?: string;
  prompt: string;
  style: string;
  type?: string;
  timestamp: number;
  status?: string;
  reason?: string;
  caption?: string;
  hashtags?: string[];
  description?: string;
}

export interface GeneratePanelProps {
  mode: "image" | "meme";
  setMode: (mode: "image" | "meme") => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  title: string;
  setTitle: (title: string) => void;
  isGeneratingTitle: boolean;
  handleGenerateTitle: () => void;
  style: string;
  setStyle: (style: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  activeSuggestions: string[];
  refreshSuggestions: () => void;
  STYLE_PRESETS: { id: string; label: string; thumbnail?: string }[];
  handleSuggestionClick: (suggestion: string) => void;
  setIsQuickEditOpen: (open: boolean) => void;
  topText: string;
  setTopText: (text: string) => void;
  bottomText: string;
  setBottomText: (text: string) => void;
  captionStyle: string;
  setCaptionStyle: (style: string) => void;
  creativity: number[];
  setCreativity: (val: number[]) => void;
  lighting: string;
  setLighting: (l: string) => void;
  negativePrompt: string;
  setNegativePrompt: (p: string) => void;
  caption: string;
  setCaption: (c: string) => void;
  isGeneratingCaption: boolean;
  handleGenerateCaption: () => void;
  resultImage: string | null;
  captionSuggestions: string[];
  history: GenerationHistoryItem[];
  handleReuseGeneration: (item: GenerationHistoryItem) => void;
  setIsConfirmClearOpen: (open: boolean) => void;
  className?: string;
}

export interface ScrollableSuggestionsProps {
  items: string[];
  onSelect: (s: string) => void;
  selectedValue?: string;
  truncateLimit?: number;
}

export interface CanvasPanelProps {
  resultImage: string | null;
  isGenerating: boolean;
  error: string | null;
  handleGenerate: () => void;
  handleRetryGeneration: () => void;
  handleDownload: (url: string) => void;
  variations: string[];
  setResultImage: (url: string) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  contrast: number;
  setContrast: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  aspectRatio: string;
  onPublishClick?: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
  isGenerationFailed?: boolean;
  isRetryingGeneration?: boolean;
}

export interface EditPanelProps {
  resultImage: string | null;
  brightness: number;
  setBrightness: (val: number) => void;
  contrast: number;
  setContrast: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  onPublishClick?: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
  className?: string;
}

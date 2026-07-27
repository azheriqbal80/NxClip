import { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  RotateCcw, 
  Check, 
  RefreshCw
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "./ui/dialog";
import { Button } from "./ui/button";

interface PhotoUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (photoDataUrl: string) => void;
}

export function PhotoUploadDialog({ isOpen, onClose, onSelect }: PhotoUploadDialogProps) {
  const [mode, setMode] = useState<"choice" | "camera" | "upload" | "preview">("choice");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when dialog closes or mode changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          aspectRatio: 1,
          width: { ideal: 400 },
          height: { ideal: 400 }
        }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode("camera");
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        // Draw centered square crop
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        
        canvas.width = 400;
        canvas.height = 400;
        context.drawImage(video, x, y, size, size, 0, 0, 400, 400);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPreviewUrl(dataUrl);
        setMode("preview");
        
        // Stop camera
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
        setMode("preview");
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMode("choice");
    setPreviewUrl(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onSelect(previewUrl);
      onClose();
      // Wait a bit before resetting to avoid flicker
      setTimeout(reset, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-display font-bold tracking-tight">
            {mode === "camera" ? "Capure Reality" : mode === "preview" ? "Confirm Portrait" : "Profile Media"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            Update your creator identity with a new visual signature.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 min-h-[300px] flex flex-col items-center justify-center">
          {mode === "choice" && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 group bg-muted/20 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                onClick={startCamera}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase">Take Photo</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 group bg-muted/20 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase">Upload File</span>
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </div>
          )}

          {mode === "camera" && (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-border group">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 border-[2px] border-dashed border-white/20 pointer-events-none rounded-xl m-4" />
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-10 w-10 rounded-full"
                  onClick={reset}
                >
                  <X size={20} />
                </Button>
                <Button 
                  size="icon" 
                  className="h-16 w-16 rounded-full bg-white hover:bg-white/90 text-black shadow-xl"
                  onClick={capturePhoto}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-black/10" />
                </Button>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {error && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <RefreshCw size={32} className="text-destructive mb-4" />
                  <p className="text-sm font-bold text-foreground mb-4">{error}</p>
                  <Button onClick={startCamera} variant="outline">Try Again</Button>
                </div>
              )}
            </div>
          )}

          {mode === "preview" && previewUrl && (
            <div className="space-y-6 w-full flex flex-col items-center">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl relative group">
                <img src={previewUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full" />
              </div>
              
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 font-bold" 
                  onClick={() => setMode("choice")}
                >
                  <RotateCcw size={16} />
                  Retake
                </Button>
                <Button 
                  className="flex-1 gap-2 font-bold" 
                  onClick={handleConfirm}
                >
                  <Check size={16} />
                  Use Photo
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="hidden">
           {/* Footers are handled in the content for better layout */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

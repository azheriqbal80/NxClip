import { motion } from "motion/react";
import { Upload, FileVideo, AlertCircle, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { triggerHaptic } from "../../lib/vibration";
import { contentApi } from "../../services/apiClient";
import { toast } from "sonner";

export default function ClipUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFlow = async (fileName: string, mimeType: string, fileSize: number) => {
    setIsUploading(true);
    setProgress(0);
    triggerHaptic('heavy');
    
    try {
      const uploadRes = await contentApi.requestUploadUrl(fileName, mimeType, fileSize);
      
      toast.info(`Requesting Upload URL: ${fileName}`, {
        description: "POST /content/upload-url initiated."
      });
      
      // Simulate binary PUT to GCS signed URL
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          triggerHaptic('success');
          toast.success("Binary PUT completed!", {
            description: `File uploaded to GCS. Asset ID: ${uploadRes.assetId}`
          });
          setTimeout(() => {
            navigate(`/create/clip/${uploadRes.assetId}/edit?step=trim`);
          }, 800);
        }
      }, 150);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed", {
        description: err?.message || "An error occurred while uploading gameplay."
      });
      setIsUploading(false);
    }
  };

  const handleDefaultUpload = async () => {
    await handleUploadFlow("epic_gameplay_clip.mp4", "video/mp4", 24117248);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadFlow(file.name, file.type, file.size);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-0">
        <div className="mb-8 md:mb-12">
          <h2 className="ui-title text-2xl md:text-3xl mb-4">Upload your gameplay</h2>
          <p className="ui-subtitle text-sm md:text-base">Drop your raw footage and let nxclip.ai do the magic.</p>
        </div>

        <div 
          onDragOver={(e) => (e.preventDefault(), setIsDragging(true))}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              await handleUploadFlow(file.name, file.type, file.size);
            } else {
              await handleDefaultUpload();
            }
          }}
          className={`aspect-video md:aspect-[21/9] rounded-xl border-2 md:border-4 border-dashed transition-all flex flex-col items-center justify-center p-6 md:p-12 text-center relative overflow-hidden ${
            isDragging 
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
              : "border-border bg-card/50 backdrop-blur-sm"
          }`}
        >
          {isUploading ? (
            <div className="w-full max-w-md space-y-6 relative z-10 px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-foreground">Uploading clip...</p>
                <p className="text-sm font-bold text-primary">{progress}%</p>
              </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                  />
                </div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">Simulating GCS PUT stream...</p>
            </div>
          ) : (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*"
              />
              <div className="ui-icon-chip-primary w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8 shadow-sm cursor-pointer" onClick={handleDefaultUpload}>
                <Upload size={28} className="md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-foreground mb-2">Drop your gaming clip here</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-medium mb-8">MP4, MOV, or AVI up to 100MB</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="default"
                  size="lg"
                >
                  Browse Files
                  <ChevronRight size={18} />
                </Button>
                <Button 
                  onClick={handleDefaultUpload}
                  variant="outline"
                  size="lg"
                >
                  Use Demo Clip
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="ui-card p-5 md:p-6 flex items-start gap-4">
            <div className="ui-icon-chip-secondary w-10 h-10 bg-emerald-500/10 text-emerald-500 shrink-0">
              <FileVideo size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">High Quality Support</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">We support 4K 60fps uploads for the best visual fidelity.</p>
            </div>
          </div>
          <div className="ui-card p-5 md:p-6 flex items-start gap-4">
            <div className="ui-icon-chip-secondary w-10 h-10 bg-amber-500/10 text-amber-500 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Upload Limits</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Uploads are limited to 100MB per file (104,857,600 bytes).</p>
            </div>
          </div>
        </div>
      </div>
  );
}

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full">
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              {/* Decorative background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-8 border border-destructive/20 rotate-3 group-hover:rotate-0 transition-transform">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                
                <h2 className="text-3xl font-display font-black mb-4 tracking-tighter text-white">
                  System Interrupt
                </h2>
                
                <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
                  An unexpected error occurred while processing this interface. Our telemetry has captured the event.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={this.handleReset}
                    variant="default"
                    className="h-12 gap-3 font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restart
                  </Button>
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="h-12 gap-3 font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Button>
                </div>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="font-mono text-[10px] text-destructive/80 mb-3 font-black uppercase tracking-[0.2em]">Diagnostic Data</p>
                    <div className="max-h-[200px] overflow-auto rounded-xl bg-black/50 p-4 border border-white/5 custom-scrollbar">
                      <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {this.state.error.stack || this.state.error.message}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-center mt-8 text-[11px] font-bold text-muted-foreground tracking-[0.2em] uppercase opacity-50">
              nxclip.ai • Failure Recovery Module
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

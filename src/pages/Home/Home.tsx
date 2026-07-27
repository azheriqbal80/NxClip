import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { SEO } from "../../components/SEO";
import Navbar from "../../components/Navbar";
import Hero from "./components/Hero";
import TrustMetrics from "./components/TrustMetrics";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import ProductShowcase from "./components/ProductShowcase";
import CreatorSpotlight from "./components/CreatorSpotlight";
import Pricing from "../../components/Pricing";
import Testimonials from "./components/Testimonials";
import FinalCTA from "./components/FinalCTA";
import Footer from "../../components/Footer";
import { toast } from "sonner";
import { isFirebaseConfigured } from "../../firebase";
import { useAppSelector } from "../../store/hooks";
import { selectAuthProvider } from "../../store/slices/uiSlice";
import { Sparkles, Info } from "lucide-react";
import { safeLocalStorage } from "../../lib/safeStorage";

export const metadata = {
  title: "AI-Powered Gaming Creator Studio",
  description: "The ultimate production suite for gaming creators. Automate your clips, analyze your audience, and grow your creator brand with AI."
};

export default function Home() {
  const { hash } = useLocation();
  const authProvider = useAppSelector(selectAuthProvider);

  useEffect(() => {
    // Show standalone mode notification on first visit
    const hasSeenWelcome = safeLocalStorage.getItem("nx_welcome_standalone_seen");
    if (!hasSeenWelcome) {
      const isMock = authProvider === "mock" || !isFirebaseConfigured;
      
      if (isMock) {
        setTimeout(() => {
          toast("🚀 Welcome to nxclip.ai", {
            description: "Running in Standalone mode. All features are simulated using high-performance local storage for a seamless offline experience.",
            duration: 8000,
            icon: <Sparkles className="text-amber-500" size={16} />,
          });
        }, 2000);
      } else {
        setTimeout(() => {
          toast.info("Production Mode Active", {
            description: "Connected to real-time creator nodes and distributed cloud processing.",
            duration: 5000,
            icon: <Info className="text-primary" size={16} />,
          });
        }, 2000);
      }
      safeLocalStorage.setItem("nx_welcome_standalone_seen", "true");
    }
  }, [authProvider]);

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to ensure component is fully rendered
        const timeoutId = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [hash]);

  return (
    <ReactLenis root>
      <div className="min-h-screen ui-bg-landing">
        <SEO title={metadata.title} description={metadata.description} />
        <Navbar />
        <main>
          <Hero />
          <TrustMetrics />
          <Features />
          <HowItWorks />
          <ProductShowcase />
          <CreatorSpotlight />
          <Pricing />
          <Testimonials />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </ReactLenis>
  );
}

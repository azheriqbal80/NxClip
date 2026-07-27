import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Heart, MessageSquare, Sparkles } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { SEO } from "../../components/SEO";

export default function PublicPostView() {
  const { id } = useParams();

  return (
    <div className="min-h-screen ui-bg-landing flex flex-col">
      <SEO 
        title={`Insane Clutch | Creator Post ${id}`} 
        description="Check out this creator's latest performance on nxclip.ai. The platform for the next generation of gaming superstars."
        type="article"
      />
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="ui-card overflow-hidden shadow-xl">
            <div className="aspect-video bg-muted relative">
              <img src={`https://picsum.photos/seed/post${id}/1280/720`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border border-border">
                    <img src="https://picsum.photos/seed/creator/100/100" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-lg font-display font-bold text-foreground">Creator Name</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest">Valorant • 2h ago</p>
                  </div>
                </div>
                <Link to="/signup">
                  <Button variant="brand-gradient" className="font-bold gap-2">
                    Follow Creator
                  </Button>
                </Link>
              </div>
              <p className="text-muted-foreground text-xl leading-relaxed mb-10">
                Check out this insane clutch from last night's stream! #valorant #gaming
              </p>
              <div className="flex items-center gap-8 pt-8 border-t border-border text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Heart size={24} />
                  <span className="font-bold">1.2k</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={24} />
                  <span className="font-bold">48</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <div className="ui-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden bg-muted/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h3 className="text-2xl font-display font-bold">Create your own clips</h3>
              </div>
              <p className="text-muted-foreground font-medium">Join 10,000+ creators using nxclip.ai to scale their gaming brand.</p>
            </div>
            <Link to="/signup">
              <Button size="hero" className="font-bold relative z-10 px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

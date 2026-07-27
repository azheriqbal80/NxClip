import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { SEO } from "../../components/SEO";

export const metadata = {
  title: "AI Creator Tools & Features",
  description: "Explore the most advanced creator tools for gaming. AI clip generation, world-class analytics, and creator coaching in one platform."
};

export default function Features() {
  return (
    <div className="min-h-screen ui-bg-landing">
      <SEO title={metadata.title} description={metadata.description} />
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <h1 className="text-5xl font-display font-bold text-foreground mb-8">Features</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Discover the power of AI-driven gaming content creation.
        </p>
      </main>
      <Footer />
    </div>
  );
}

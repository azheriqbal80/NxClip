import PricingSection from "../../components/Pricing";

export default function UpgradePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-display font-bold text-foreground mb-4">Unlock your full potential</h2>
        <p className="text-muted-foreground font-medium text-lg">Choose the plan that fits your creator journey.</p>
      </div>
      <PricingSection />
    </div>
  );
}

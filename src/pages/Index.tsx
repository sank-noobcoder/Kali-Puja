import { Button } from "@/components/ui/button";
import SignatureGlow from "@/components/ui/SignatureGlow";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Swarnakar Sangha Kali Puja — Home";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SignatureGlow />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container py-16 md:py-24 grid md:grid-cols-2 items-center gap-40">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Goura Purbo Para Swarnakar Sangha Kali Puja – Full of Culture.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover yearly memories, support our mission, and collaborate with fellow admins to manage events and expenses.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/gallery">View Gallery</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/donate">Donate</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image Container - resized */}
          <div className="w-full max-w-md aspect-[3/3] rounded-xl border shadow-elegant overflow-hidden">
            <img
              src="/kali2.jpg" // Place this in public/kali.jpg
              alt="Cultural Club Highlight"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section id="gallery" className="container py-12 md:py-16">
        <h2 className="text-2xl font-semibold">Highlights</h2>
        <p className="text-muted-foreground mt-2">
          Curated moments from recent years.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "1.jpg",
            "2.jpg",
            "3.jpg",
            "/highlight4.jpg",
            "/highlight5.jpg",
            "/highlight6.jpg"
          ].map((src, i) => (
            <div
              key={i}
              className="w-full aspect-[4/3] rounded-lg overflow-hidden border bg-card shadow-sm"
            >
              <img
                src={src}
                alt={`Highlight ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button asChild>
            <Link to="/gallery">Open Full Gallery</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;

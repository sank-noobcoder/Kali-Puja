import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const Donation = () => {
  useEffect(() => { document.title = "Cultural Club — Donation"; }, []);

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold">Support Our Cultural Club</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Your donations help us organize events, preserve traditions, and empower artists.
      </p>

      <section className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 bg-card">
          <h2 className="text-xl font-medium">Public Info</h2>
          <ul className="mt-3 text-sm text-muted-foreground list-disc pl-4 space-y-1">
            <li>Bank name and account: will be shown after setup</li>
            <li>UPI/PayPal links can be added</li>
            <li>Transparent use of funds via Admin Expense Tracker</li>
          </ul>
          <div className="mt-4"><Button variant="secondary">Learn More</Button></div>
        </div>
        <div className="rounded-xl border p-6 bg-card">
          <h2 className="text-xl font-medium">Admin QR Code</h2>
          <p className="text-sm text-muted-foreground">Only visible to admins after login.</p>
          <div className="mt-4 aspect-square rounded-lg bg-gradient-primary"/>
        </div>
      </section>
    </main>
  );
};

export default Donation;
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Gallery() {
  const params = useParams();
  const yearParam = Number(params.year);
  const [items, setItems] = useState<{ id: string; kind: "photo" | "video"; storage_path: string }[]>([]);

  const title = useMemo(() => (Number.isFinite(yearParam) ? `Gallery ${yearParam}` : "Gallery"), [yearParam]);

  useEffect(() => {
    document.title = `${title} – Cultural Club`;
  }, [title]);

  useEffect(() => {
    if (!Number.isFinite(yearParam)) return;
    supabase
      .from("media")
      .select("id, kind, storage_path")
      .eq("year", yearParam)
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const mapped = (data ?? []).map((d) => ({ id: d.id as string, kind: (d.kind as "photo" | "video"), storage_path: d.storage_path as string }));
        setItems(mapped);
      });
  }, [yearParam]);

  return (
    <main className="min-h-screen container py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <Button asChild variant="soft">
          <Link to="/">Back Home</Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">No media yet for this year.</Card>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((m) => {
            const { data } = supabase.storage.from("media").getPublicUrl(m.storage_path);
            const url = data.publicUrl;
            return (
              <div key={m.id} className="rounded-lg overflow-hidden border shadow-sm">
                {m.kind === "photo" ? (
                  <img src={url} alt={`Media ${m.id}`} loading="lazy" className="w-full h-40 object-cover" />
                ) : (
                  <video src={url} controls className="w-full h-40 object-cover" />
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

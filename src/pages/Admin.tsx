import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ADMIN_PASS = "kali_puja@2025";

type MediaRow = {
  id: string;
  year: number;
  kind: "photo" | "video";
  storage_path: string;
  visible: boolean;
};

type ExpenseRow = {
  id: string;
  year: number;
  amount: number;
  category: string | null;
  description: string | null;
  expense_date: string;
  is_deleted: boolean;
  delete_reason: string | null;
};

export default function Admin() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(ADMIN_PASS);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const yearOptions = useMemo(() => {
    const y: number[] = [];
    for (let i = currentYear; i >= currentYear - 10; i--) y.push(i);
    return y;
  }, [currentYear]);

  // Media state
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [uploading, setUploading] = useState(false);

  // Expense state
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setIsAdmin(false);
        return;
      }
      // Check role
      setTimeout(async () => {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        setIsAdmin(Boolean(data?.some((r) => r.role === "admin")));
      }, 0);
    });

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void fetchMedia();
      void fetchExpenses();
    } else {
      setMedia([]);
      setExpenses([]);
    }
  }, [isAdmin, year]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: signInRes, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        // If user doesn't exist, sign up
        const redirectUrl = `${window.location.origin}/admin`;
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (signUpErr) throw signUpErr;
        toast({ title: "Check your inbox", description: "Confirm your email to finish signup." });
        return;
      }

      const uid = signInRes.user?.id;
      if (uid) {
        // Self-assign admin role (allowed by policy)
        await supabase.from("user_roles").insert({ user_id: uid, role: "admin" }).select().maybeSingle();
        toast({ title: "Welcome", description: "Admin access granted." });
      }
    } catch (err: any) {
      toast({ title: "Login error", description: err.message ?? String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function fetchMedia() {
    const { data } = await supabase
      .from("media")
      .select("id, year, kind, storage_path, visible")
      .eq("year", year)
      .order("created_at", { ascending: false });
    const mapped: MediaRow[] = (data ?? []).map((d: any) => ({
      id: d.id,
      year: d.year,
      kind: (d.kind as "photo" | "video"),
      storage_path: d.storage_path,
      visible: d.visible,
    }));
    setMedia(mapped);
  }

  async function onUploadFiles(files: FileList | null) {
    if (!files || !userId) return;
    setUploading(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        const timestamp = Date.now();
        const path = `${year}/${timestamp}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const kind: "photo" | "video" = file.type.startsWith("video") ? "video" : "photo";
        const { error: insErr } = await supabase.from("media").insert({
          user_id: userId,
          year,
          kind,
          storage_path: path,
          visible: true,
        });
        if (insErr) throw insErr;
      });
      await Promise.all(uploads);
      toast({ title: "Uploaded", description: "Your files were uploaded." });
      await fetchMedia();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message ?? String(err) });
    } finally {
      setUploading(false);
    }
  }

  async function toggleVisibility(row: MediaRow) {
    const { error } = await supabase
      .from("media")
      .update({ visible: !row.visible })
      .eq("id", row.id);
    if (!error) {
      setMedia((prev) => prev.map((m) => (m.id === row.id ? { ...m, visible: !row.visible } : m)));
    }
  }

  async function fetchExpenses() {
    const { data } = await supabase
      .from("expenses")
      .select("id, year, amount, category, description, expense_date, is_deleted, delete_reason")
      .eq("year", year)
      .order("expense_date", { ascending: false });
    setExpenses(data ?? []);
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const amount = Number(expenseForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number." });
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      year,
      amount,
      category: expenseForm.category || null,
      description: expenseForm.description || null,
      expense_date: expenseForm.date,
    });
    if (error) {
      toast({ title: "Failed", description: error.message });
    } else {
      toast({ title: "Added", description: "Expense saved." });
      setExpenseForm({ amount: "", category: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
      await fetchExpenses();
    }
  }

  async function deleteExpense(row: ExpenseRow) {
    const reason = window.prompt("Reason for deleting this expense?");
    if (!reason) return;
    const { error } = await supabase
      .from("expenses")
      .update({ is_deleted: true, delete_reason: reason })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message });
    } else {
      toast({ title: "Deleted", description: "Expense marked as deleted." });
      await fetchExpenses();
    }
  }

  async function uploadQR(file: File | null) {
    if (!file) return;
    const { error } = await supabase.storage.from("donations").upload("qr.png", file, { upsert: true });
    if (error) toast({ title: "QR upload failed", description: error.message });
    else toast({ title: "QR updated", description: "Donation QR saved." });
  }

  if (!userId || !isAdmin) {
    return (
      <main className="min-h-screen container py-12 flex flex-col items-center justify-center">
        <article className="w-full max-w-md">
          <Card className="shadow-[var(--shadow-elegant)]">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  {/* <p className="text-sm text-muted-foreground">Default password: {ADMIN_PASS}</p> */}
                </div>
                <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign in / Sign up"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen container py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage gallery, donations, and expenses</p>
      </header>

      <section className="mb-6">
        <Label className="mr-3">Year</Label>
        <select
          className="h-10 px-3 rounded-md border bg-background"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </section>

      <Tabs defaultValue="media" className="w-full">
        <TabsList>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="donation">Donation QR</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Photos/Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" multiple accept="image/*,video/*" onChange={(e) => onUploadFiles(e.target.files)} />
              <Button disabled={uploading} variant="hero">
                {uploading ? "Uploading..." : "Select files above"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((m) => {
              const { data } = supabase.storage.from("media").getPublicUrl(m.storage_path);
              const url = data.publicUrl;
              return (
                <div key={m.id} className="rounded-lg overflow-hidden border shadow-sm">
                  {m.kind === "photo" ? (
                    <img src={url} alt={`Media ${m.id}`} loading="lazy" className="w-full h-40 object-cover" />
                  ) : (
                    <video src={url} controls className="w-full h-40 object-cover" />
                  )}
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.visible ? "Visible" : "Hidden"}</span>
                    <Button size="sm" variant={m.visible ? "secondary" : "default"} onClick={() => toggleVisibility(m)}>
                      {m.visible ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addExpense} className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    inputMode="decimal"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="md:col-span-3 flex items-end">
                  <Button type="submit" variant="hero">Save Expense</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {expenses.map((ex) => (
              <Card key={ex.id} className={ex.is_deleted ? "opacity-60" : ""}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">₹ {ex.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {ex.category || "Uncategorized"} • {ex.description || "No details"}
                    </div>
                    <div className="text-xs text-muted-foreground">{ex.expense_date}</div>
                    {ex.is_deleted && ex.delete_reason && (
                      <div className="text-xs text-destructive mt-1">Deleted: {ex.delete_reason}</div>
                    )}
                  </div>
                  {!ex.is_deleted && (
                    <Button variant="destructive" size="sm" onClick={() => deleteExpense(ex)}>
                      Delete
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donation">
          <Card>
            <CardHeader>
              <CardTitle>Upload/Update Donation QR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept="image/*" onChange={(e) => uploadQR(e.target.files?.[0] ?? null)} />
              <p className="text-sm text-muted-foreground">Only admins can view and update the QR.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

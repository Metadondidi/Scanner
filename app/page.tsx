"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Sparkles, Loader2, Plus, X } from "lucide-react";
import type { Brand, Review } from "@/types";
import { BRAND_LABELS } from "@/types";
import KanbanBoard from "@/components/KanbanBoard";

const BRANDS: Brand[] = ["green", "red"];

const BRAND_STYLES: Record<Brand, { active: string; tab: string; badge: string }> = {
  green: {
    active: "bg-[#2d7a4f] text-white",
    tab:    "hover:bg-green-50 text-gray-600",
    badge:  "bg-green-100 text-[#2d7a4f]",
  },
  red: {
    active: "bg-[#c0392b] text-white",
    tab:    "hover:bg-red-50 text-gray-600",
    badge:  "bg-red-100 text-[#c0392b]",
  },
};

export default function HomePage() {
  const [brand, setBrand] = useState<Brand>("green");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({ author: "", rating: 5, content: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?brand=${brand}`);
      setReviews(await res.json());
    } finally {
      setLoadingReviews(false);
    }
  }, [brand]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  function handleUpdate(updated: Review) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDelete(id: number) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand }),
      });
      const data = await res.json();
      if (!res.ok) { alert("Erreur : " + data.error); return; }
      alert(`Scraping terminé : ${data.inserted} nouvel(aux) avis importé(s), ${data.skipped} ignoré(s).`);
      fetchReviews();
    } catch (e) {
      alert("Erreur réseau : " + (e as Error).message);
    } finally {
      setScraping(false);
    }
  }

  async function handleGenerateAll() {
    const pending = reviews.filter((r) => r.status === "pending" && !r.response);
    if (pending.length === 0) { alert("Aucun avis à traiter."); return; }
    if (!confirm(`Générer des réponses pour ${pending.length} avis ?`)) return;

    setGeneratingAll(true);
    let done = 0;
    for (const review of pending) {
      try {
        const res = await fetch(`/api/generate/${review.id}`, { method: "POST" });
        if (res.ok) { handleUpdate(await res.json()); done++; }
      } catch { /* skip */ }
    }
    setGeneratingAll(false);
    alert(`${done} réponse(s) générée(s).`);
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!newReview.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, ...newReview }),
      });
      const created = await res.json();
      setReviews((prev) => [created, ...prev]);
      setNewReview({ author: "", rating: 5, content: "" });
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Reviews Scanner</h1>
          <p className="text-xs text-gray-500">Powered by Claude (Anthropic)</p>
        </div>

        {/* Brand tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                brand === b ? BRAND_STYLES[b].active : BRAND_STYLES[b].tab
              }`}
            >
              {BRAND_LABELS[b]}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Plus size={15} /> Ajouter
          </button>

          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {scraping ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Scraper Google
          </button>

          <button
            onClick={handleGenerateAll}
            disabled={generatingAll || pendingCount === 0}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {generatingAll ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Tout générer {pendingCount > 0 && `(${pendingCount})`}
          </button>

          <button
            onClick={fetchReviews}
            disabled={loadingReviews}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={15} className={loadingReviews ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6">
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BRAND_STYLES[brand].badge}`}>
            {BRAND_LABELS[brand]}
          </span>
          <span className="text-sm text-gray-500">{reviews.length} avis au total</span>
        </div>

        {loadingReviews ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <KanbanBoard reviews={reviews} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </main>

      {/* Add review modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ajouter un avis manuellement</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                <input
                  type="text"
                  value={newReview.author}
                  onChange={(e) => setNewReview((p) => ({ ...p, author: e.target.value }))}
                  placeholder="Nom du client"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNewReview((p) => ({ ...p, rating: n }))}
                      className={`text-2xl leading-none ${n <= newReview.rating ? "text-amber-400" : "text-gray-200"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avis *</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  placeholder="Texte de l'avis…"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

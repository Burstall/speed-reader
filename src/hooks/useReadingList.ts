'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SavedArticle,
  getAllArticles,
  saveArticle,
  deleteArticle,
  getArticle,
  updateProgress,
  isArticleSaved,
  getArticleByUrl,
} from '@/lib/offlineStore';

export function useReadingList() {
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all articles on mount
  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const allArticles = await getAllArticles();
      setArticles(allArticles);
      setError(null);
    } catch (err) {
      setError('Failed to load reading list');
      console.error('Failed to load articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Listen for external save events (e.g., from FeedBrowser)
  useEffect(() => {
    const handleUpdate = () => loadArticles();
    window.addEventListener('reading-list-updated', handleUpdate);
    return () => window.removeEventListener('reading-list-updated', handleUpdate);
  }, [loadArticles]);

  // Save a new article
  const save = useCallback(async (
    url: string,
    title: string,
    content: string,
    source: string
  ): Promise<SavedArticle | null> => {
    try {
      const words = content.split(/\s+/).filter(w => w.length > 0);
      const saved = await saveArticle({
        url,
        title,
        content,
        wordCount: words.length,
        currentIndex: 0,
        source,
      });
      await loadArticles();
      return saved;
    } catch (err) {
      console.error('Failed to save article:', err);
      return null;
    }
  }, [loadArticles]);

  // Remove an article
  const remove = useCallback(async (id: string) => {
    try {
      await deleteArticle(id);
      await loadArticles();
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  }, [loadArticles]);

  // Update reading progress
  const saveProgress = useCallback(async (id: string, currentIndex: number) => {
    try {
      await updateProgress(id, currentIndex);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, []);

  // Check if a URL is already saved
  const checkSaved = useCallback(async (url: string): Promise<boolean> => {
    return isArticleSaved(url);
  }, []);

  // Get article by ID
  const getById = useCallback(async (id: string): Promise<SavedArticle | null> => {
    return getArticle(id);
  }, []);

  // Get article by URL
  const getByUrl = useCallback(async (url: string): Promise<SavedArticle | null> => {
    return getArticleByUrl(url);
  }, []);

  return {
    articles,
    isLoading,
    error,
    save,
    remove,
    saveProgress,
    checkSaved,
    getById,
    getByUrl,
    refresh: loadArticles,
  };
}

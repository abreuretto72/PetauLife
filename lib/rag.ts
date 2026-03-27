import { supabase } from './supabase';

export async function searchRAG(petId: string, query: string, limit = 5) {
  const { data, error } = await supabase.functions.invoke('search-rag', {
    body: { pet_id: petId, query, limit },
  });
  if (error) throw error;
  return data as { results: Array<{ content: string; similarity: number; content_type: string }> };
}

export async function generateEmbedding(
  petId: string,
  contentType: string,
  contentId: string,
  contentText: string,
  importance: number,
) {
  const { data, error } = await supabase.functions.invoke('generate-embedding', {
    body: { pet_id: petId, content_type: contentType, content_id: contentId, content_text: contentText, importance },
  });
  if (error) throw error;
  return data;
}

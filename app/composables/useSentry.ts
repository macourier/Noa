/**
 * useSentry — Simulated intelligence for document triage.
 * 
 * In production, this would call an AI endpoint.
 * For MVP, it uses filename pattern matching with a realistic 3s delay.
 */

import type { TileCategory } from './useTiles'

interface AnalysisResult {
  tileId: TileCategory
  newStatus: 'ok' | 'action' | 'alerte'
  confidence: number
  detectedKeywords: string[]
}

const TILE_KEYWORDS: Record<TileCategory, string[]> = {
  'france-travail': [
    'france travail', 'pole emploi', 'actualisation', 'demandeur', 'emploi',
    'cv', 'lettre motivation', 'entretien', 'formation', 'stage', 'allocations',
    'are', 'ass', 'rsa', 'inscription',
  ],
  'energie': [
    'edf', 'gdf', 'engie', 'totalenergie', 'facture energie', 'electricite',
    'gaz', 'eau', 'chauffage', 'consommation', 'compteur', 'linky',
    'kilowatt', 'kwatt', 'billing', 'facture',
  ],
  'impots': [
    'impot', 'fiscal', 'declaration', 'revenu', 'taxe', 'crf', 'cerfa',
    'prelevement', 'credit impot', 'reduction', 'foncier', 'taxe habitation',
    'dgfip', 'limpot', 'des impots',
  ],
  'identite': [
    'carte identite', 'passeport', 'naissance', 'mariage', 'nationalite',
    'sejour', 'visas', 'titre', 'cni', 'passport', 'justificatif',
    'domicile', 'attestation', 'carte vitale', 'ameil', 'mutuel',
  ],
}

function analyzeFilename(filename: string): AnalysisResult {
  const lower = filename.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  let bestMatch: TileCategory = 'identite'
  let bestScore = 0
  let matchedKeywords: string[] = []

  for (const [tileId, keywords] of Object.entries(TILE_KEYWORDS) as [TileCategory, string[]][]) {
    const matches = keywords.filter(kw => lower.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
    const score = matches.length
    if (score > bestScore) {
      bestScore = score
      bestMatch = tileId
      matchedKeywords = matches
    }
  }

  return {
    tileId: bestMatch,
    newStatus: 'action',
    confidence: Math.min(bestScore / 3, 1),
    detectedKeywords: matchedKeywords,
  }
}

export function useSentry() {
  const isAnalyzing = ref(false)

  /**
   * Simulates document analysis with a realistic delay.
   * Returns the analysis result after ~3 seconds.
   */
  async function analyzeDocument(filename: string, _fileType: string): Promise<AnalysisResult> {
    isAnalyzing.value = true

    // Simulate processing time (2.5-3.5s for realism)
    const delay = 2500 + Math.random() * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    const result = analyzeFilename(filename)
    isAnalyzing.value = false

    return result
  }

  return {
    isAnalyzing: readonly(isAnalyzing),
    analyzeDocument,
  }
}
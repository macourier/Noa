import type { Component } from 'vue'
import { Briefcase, Zap, Fingerprint, User } from 'lucide-vue-next'

export type TileStatus = 'action' | 'ok' | 'alerte'
export type TileCategory = 'france-travail' | 'energie' | 'impots' | 'identite'

export interface TileData {
  id: TileCategory
  title: string
  subtitle: string
  icon: Component
  status: TileStatus
  order: number
  uploading?: boolean
  analyzing?: boolean
}

const DEFAULT_TILES: TileData[] = [
  {
    id: 'france-travail',
    title: 'France Travail',
    subtitle: 'Actualisation requise',
    icon: Briefcase,
    status: 'action',
    order: 0,
  },
  {
    id: 'energie',
    title: 'Énergie',
    subtitle: 'Consommation stable',
    icon: Zap,
    status: 'ok',
    order: 1,
  },
  {
    id: 'impots',
    title: 'Impôts',
    subtitle: 'Déclaration attendue',
    icon: Fingerprint,
    status: 'alerte',
    order: 2,
  },
  {
    id: 'identite',
    title: 'Identité',
    subtitle: 'Documents à jour',
    icon: User,
    status: 'ok',
    order: 3,
  },
]

export function useTiles() {
  const tiles = ref<TileData[]>([...DEFAULT_TILES])
  const isRealtimeConnected = ref(false)

  // Get a tile by category ID
  function getTile(id: TileCategory): TileData | undefined {
    return tiles.value.find(t => t.id === id)
  }

  // Update a tile's status with optimistic UI
  function updateTileStatus(id: TileCategory, status: TileStatus, subtitle?: string) {
    const tile = tiles.value.find(t => t.id === id)
    if (tile) {
      tile.status = status
      if (subtitle) tile.subtitle = subtitle
    }
  }

  // Set uploading state on a tile
  function setTileUploading(id: TileCategory, uploading: boolean) {
    const tile = tiles.value.find(t => t.id === id)
    if (tile) tile.uploading = uploading
  }

  // Set analyzing state on a tile
  function setTileAnalyzing(id: TileCategory, analyzing: boolean) {
    const tile = tiles.value.find(t => t.id === id)
    if (tile) tile.analyzing = analyzing
  }

  // Sort tiles: alert/action first, then by order
  const sortedTiles = computed(() => {
    return [...tiles.value].sort((a, b) => {
      const priority = (s: TileStatus) => s === 'alerte' ? 0 : s === 'action' ? 1 : 2
      const pa = priority(a.status)
      const pb = priority(b.status)
      if (pa !== pb) return pa - pb
      return a.order - b.order
    })
  })

  // Status summary counts
  const statusCounts = computed(() => {
    const counts = { ok: 0, action: 0, alerte: 0 }
    tiles.value.forEach(t => counts[t.status]++)
    return counts
  })

  // Subscribe to Appwrite Realtime for tiles collection
  // This works once Appwrite is configured with a project ID
  function subscribeRealtime() {
    const config = useRuntimeConfig()
    const projectId = config.public.appwriteProjectId as string
    if (!projectId) {
      // No Appwrite project configured — skip realtime
      return () => {}
    }

    try {
      const { $appwrite } = useNuxtApp()
      const unsubscribe = $appwrite.subscribe(
        'collections.tiles.documents',
        (response: any) => {
          const payload = response.payload
          if (payload && payload.$id) {
            const tileId = payload.$id as TileCategory
            const tile = tiles.value.find(t => t.id === tileId)
            if (tile) {
              tile.status = payload.status || tile.status
              tile.subtitle = payload.subtitle || tile.subtitle
            }
          }
        },
      )
      isRealtimeConnected.value = true
      return unsubscribe
    }
    catch {
      return () => {}
    }
  }

  /**
   * Load tiles from Appwrite (fallback to defaults if no DB).
   *
   * 🛡️ OWNER ONLY: The query relies on Appwrite's document-level
   * permissions. The collection MUST be configured so that each
   * document is only readable by its owner (user:[USER_ID]).
   * The SDK automatically filters based on the authenticated session.
   *
   * If role:all is accidentally set, ALL users would see each
   * other's tiles — this is a CRITICAL security regression.
   */
  async function loadTiles() {
    const config = useRuntimeConfig()
    const projectId = config.public.appwriteProjectId as string
    if (!projectId) return

    try {
      const { $databases, $appwriteQuery } = useNuxtApp()
      const res = await $databases.listDocuments('noa-db', 'tiles', [
        $appwriteQuery.orderAsc('order'),
      ])
      if (res.documents.length > 0) {
        const iconMap: Record<string, Component> = {
          Briefcase,
          Zap,
          Fingerprint,
          User,
        }
        tiles.value = res.documents.map((doc: Record<string, unknown>) => ({
          id: doc.$id as TileCategory,
          title: (doc.title as string) || '',
          subtitle: (doc.subtitle as string) || '',
          icon: iconMap[(doc.icon_name as string)] || User,
          status: (doc.status as TileStatus) || 'ok',
          order: (doc.order as number) ?? 0,
        }))
      }
    }
    catch {
      // Fallback to defaults — security: no data leak on error
    }
  }

  onMounted(() => {
    loadTiles()
    const unsubscribe = subscribeRealtime()
    onUnmounted(() => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })
  })

  return {
    tiles: readonly(tiles),
    sortedTiles: readonly(sortedTiles),
    statusCounts: readonly(statusCounts),
    isRealtimeConnected: readonly(isRealtimeConnected),
    getTile,
    updateTileStatus,
    setTileUploading,
    setTileAnalyzing,
    loadTiles,
  }
}
<script setup lang="ts">
import { Upload, FileText, Loader2, AlertTriangle } from 'lucide-vue-next'
import type { TileCategory } from '~/composables/useTiles'
import { validateFile, generateSafeFilename } from '~/utils/security'

const props = defineProps<{
  activeTileId?: TileCategory | null
}>()

const emit = defineEmits<{
  fileUploaded: [tileId: TileCategory, filename: string]
}>()

const { isAnalyzing, analyzeDocument } = useSentry()
const { updateTileStatus, setTileUploading, setTileAnalyzing, getTile } = useTiles()

const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const lastUpload = ref<{ filename: string; tileId: TileCategory } | null>(null)
const showSuccess = ref(false)
const rejectionReason = ref<string | null>(null)

let dragCounter = 0

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  dragCounter = 0

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

async function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
  input.value = ''
}

async function processFile(file: File) {
  // ─── Security Gate: Validate BEFORE any processing ───────────
  const validation = validateFile(file)
  if (!validation.isValid) {
    rejectionReason.value = validation.error
    setTimeout(() => { rejectionReason.value = null }, 4000)
    return
  }

  // Sanitize filename — original name is NEVER used as storage path
  const safeFilename = generateSafeFilename(file.name)
  const fileType = file.type

  isUploading.value = true
  uploadProgress.value = 0

  // Step 1: Analyze the document (optimistic — we already know the category)
  const analysisPromise = analyzeDocument(safeFilename, fileType)

  // Step 2: Simulate upload to Appwrite Storage
  const targetTileId = props.activeTileId || 'identite'

  // Optimistic UI: immediately show uploading state
  setTileUploading(targetTileId, true)

  // Simulate upload progress
  for (let i = 0; i <= 90; i += Math.random() * 20) {
    uploadProgress.value = Math.min(i, 90)
    await new Promise(r => setTimeout(r, 80))
  }

  // Wait for analysis to complete
  const result = await analysisPromise

  // Upload "complete"
  uploadProgress.value = 100
  setTileUploading(targetTileId, false)

  // Step 3: Update tile with analysis result (optimistic)
  setTileAnalyzing(result.tileId, true)

  // Brief analysis display
  await new Promise(r => setTimeout(r, 600))
  setTileAnalyzing(result.tileId, false)

  // Update the actual tile status
  updateTileStatus(result.tileId, result.newStatus, `Document détecté: ${file.name}`)

  // Show success
  lastUpload.value = { filename: file.name, tileId: result.tileId }
  showSuccess.value = true
  setTimeout(() => { showSuccess.value = false }, 3000)

  isUploading.value = false
  uploadProgress.value = 0

  emit('fileUploaded', result.tileId, file.name)
}
</script>

<template>
  <!-- Universal drop zone overlay -->
  <div
    class="fixed inset-0 z-[60] pointer-events-none"
    :class="{ 'pointer-events-auto': isDragging }"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <!-- Drag overlay -->
    <Transition name="dropzone">
      <div
        v-if="isDragging"
        class="absolute inset-4 sm:inset-8 rounded-3xl border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-sm flex items-center justify-center"
      >
        <div class="text-center space-y-3">
          <div class="p-4 rounded-2xl bg-primary/10 border border-primary/20 mx-auto w-fit">
            <Upload class="size-8 text-primary animate-bounce" />
          </div>
          <p class="text-white/60 text-sm font-light">
            Déposez votre document ici
          </p>
          <p class="text-white/20 text-xs">
            PDF, JPG, PNG ou WebP uniquement
          </p>
        </div>
      </div>
    </Transition>

    <!-- Upload progress overlay -->
    <Transition name="progress">
      <div
        v-if="isUploading"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
      >
        <div class="px-6 py-4 bg-surface/90 backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-2xl flex items-center gap-4 min-w-[300px]">
          <div class="relative">
            <Loader2 class="size-5 text-primary animate-spin" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white/60 text-xs truncate">Analyse en cours...</p>
            <div class="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Success toast -->
    <Transition name="toast">
      <div
        v-if="showSuccess && lastUpload"
        class="absolute top-20 right-5 sm:right-8 pointer-events-auto"
      >
        <div class="px-5 py-3 bg-ok/10 backdrop-blur-xl rounded-xl border border-ok/20 flex items-center gap-3">
          <FileText class="size-4 text-ok" />
          <div>
            <p class="text-ok text-xs font-medium">Document trié</p>
            <p class="text-white/30 text-[10px]">{{ lastUpload.filename }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Rejection toast (security) -->
    <Transition name="toast">
      <div
        v-if="rejectionReason"
        class="absolute top-20 right-5 sm:right-8 pointer-events-auto"
      >
        <div class="px-5 py-3 bg-warning/10 backdrop-blur-xl rounded-xl border border-warning/20 flex items-center gap-3 max-w-xs">
          <AlertTriangle class="size-4 text-warning shrink-0" />
          <div>
            <p class="text-warning text-xs font-medium">Fichier refusé</p>
            <p class="text-white/30 text-[10px]">{{ rejectionReason }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Hidden file input for click-to-upload — restricted to safe types only -->
  <input
    id="file-input"
    type="file"
    class="hidden"
    accept=".pdf,.jpg,.jpeg,.png,.webp"
    @change="onFileInput"
  />
</template>

<style scoped>
.dropzone-enter-active,
.dropzone-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.dropzone-enter-from,
.dropzone-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.progress-enter-active,
.progress-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.progress-enter-from,
.progress-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
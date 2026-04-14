import { onMounted, onUnmounted } from 'vue'

interface SwipeDownOptions {
  threshold?: number
  onSwipeDown: () => void
}

export function useSwipeDown(elementRef: Ref<HTMLElement | null>, options: SwipeDownOptions) {
  const threshold = options.threshold ?? 120
  let startY = 0
  let currentY = 0
  let isTracking = false

  function onTouchStart(e: TouchEvent) {
    const el = elementRef.value
    if (!el) return
    // Only track if scrolled to top
    if (el.scrollTop <= 0) {
      startY = e.touches[0].clientY
      isTracking = true
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isTracking) return
    currentY = e.touches[0].clientY
    const diff = currentY - startY

    if (diff > 0) {
      const el = elementRef.value
      if (el) {
        const progress = Math.min(diff / threshold, 1)
        el.style.transform = `translateY(${diff * 0.5}px)`
        el.style.opacity = `${1 - progress * 0.4}`
      }
    }
  }

  function onTouchEnd() {
    if (!isTracking) return
    isTracking = false

    const diff = currentY - startY
    const el = elementRef.value

    if (diff > threshold) {
      options.onSwipeDown()
    }

    if (el) {
      el.style.transform = ''
      el.style.opacity = ''
      el.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
      setTimeout(() => {
        if (el) el.style.transition = ''
      }, 300)
    }

    startY = 0
    currentY = 0
  }

  onMounted(() => {
    const el = elementRef.value
    if (el) {
      el.addEventListener('touchstart', onTouchStart, { passive: true })
      el.addEventListener('touchmove', onTouchMove, { passive: true })
      el.addEventListener('touchend', onTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    const el = elementRef.value
    if (el) {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  })
}
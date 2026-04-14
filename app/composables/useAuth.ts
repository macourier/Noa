/**
 * useAuth — Authentication composable for NOA.
 *
 * Handles anonymous session creation, session restoration,
 * and future email conversion for permanent vault.
 */
import type { Models } from 'appwrite'

export function useAuth() {
  const { $account } = useNuxtApp()

  const user = ref<Models.User<Models.Preferences> | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Whether the current session is anonymous (no email linked).
   * Used to show the "temporary vault" warning banner.
   */
  const isAnonymous = computed(() => {
    if (!user.value) return true
    // Appwrite anonymous users have no email verification
    return !user.value.email || user.value.email.length === 0
  })

  /**
   * Whether the user has linked an email (permanent vault).
   */
  const hasLinkedEmail = computed(() => {
    if (!user.value) return false
    return Boolean(user.value.email && user.value.email.length > 0)
  })

  async function signInAnonymously() {
    isLoading.value = true
    error.value = null
    try {
      await $account.createAnonymousSession()
      user.value = await $account.get()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion anonyme'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function getCurrentUser() {
    try {
      user.value = await $account.get()
      return user.value
    }
    catch {
      user.value = null
      return null
    }
  }

  async function signOut() {
    try {
      await $account.deleteSession('current')
      user.value = null
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de déconnexion'
      error.value = message
    }
  }

  /**
   * Convert anonymous session to permanent account with email.
   * This secures the vault — data survives device changes.
   *
   * ⚠️ Phase 2 implementation — placeholder for now.
   * Will use $account.updateEmail() after email verification flow.
   */
  async function linkEmail(_email: string, _password: string): Promise<void> {
    // TODO: Implement email linking with Appwrite
    // 1. $account.updateEmail(email, password)
    // 2. $account.updateName(userChosenName)
    // 3. Refresh user state
    throw new Error('Email linking not yet implemented — coming in Phase 2')
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAnonymous: readonly(isAnonymous),
    hasLinkedEmail: readonly(hasLinkedEmail),
    signInAnonymously,
    getCurrentUser,
    signOut,
    linkEmail,
  }
}
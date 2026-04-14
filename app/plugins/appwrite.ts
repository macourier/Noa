import { Client, Account, Databases, Storage, ID, Query } from 'appwrite'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const client = new Client()
  client.setEndpoint(config.public.appwriteEndpoint as string)
  client.setProject(config.public.appwriteProjectId as string)

  const account = new Account(client)
  const databases = new Databases(client)
  const storage = new Storage(client)

  return {
    provide: {
      appwrite: client,
      account,
      databases,
      storage,
      appwriteID: ID,
      appwriteQuery: Query,
    },
  }
})
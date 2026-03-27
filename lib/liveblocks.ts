import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

const client = createClient({
  authEndpoint: '/api/liveblocks-auth',
})

type Presence = Record<string, never>
type Storage = Record<string, never>
type UserMeta = {
  info: {
    name: string
    color: string
    avatar?: string
  }
}

export const {
  RoomProvider,
  useRoom,
  useSelf,
  useOthers,
} = createRoomContext<Presence, Storage, UserMeta>(client)

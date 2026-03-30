// Global Liveblocks type declarations.
// These tell @liveblocks/react the shape of userInfo so cursor names/colors
// are correctly typed throughout the app.
declare global {
  interface Liveblocks {
    UserMeta: {
      id: string
      info: {
        name: string
        color: string
        avatar?: string
      }
    }
  }
}

export {}

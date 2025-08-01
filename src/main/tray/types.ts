export interface BaseTrayProps {
  icon: string
}

export type BaseTrayComposable<T extends BaseTrayProps> = (props: T) => {
  createTray: () => void
}

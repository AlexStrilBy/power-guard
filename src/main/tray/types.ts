export interface BaseTrayProps {
  icon: string
}

export type BaseTrayComposable = (props: BaseTrayProps) => {
  createTray: () => void
}

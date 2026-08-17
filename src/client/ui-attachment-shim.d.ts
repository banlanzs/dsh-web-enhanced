/** Type shim for the host-owned attachment gallery (external in the client bundle). */
declare module '@deepseek-ai/dsh-client-ui-attachment' {
  import type { ReactNode } from 'react'
  export interface ImageLoaderFace {
    (attachment: unknown): Promise<string>
  }
  export interface ImageGalleryLabelsFace {
    readonly image: string
    readonly open: string
    readonly openNamed: (label: string) => string
    readonly loading: string
    readonly loadFailed: string
    readonly lightbox: { readonly dialog: string; readonly close: string }
  }
  export const ImageGallery: (props: {
    readonly images: readonly { readonly attachment: unknown }[]
    readonly load: ImageLoaderFace
    readonly align: 'start' | 'end'
    readonly labels: ImageGalleryLabelsFace
  }) => ReactNode
}

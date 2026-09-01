import { icons as baked } from 'virtual:dashboard'

import { useStore } from '../store'

interface IconProps {
  className?: string
  /** Shown when there is no icon, or its SVG has not been cached yet. */
  fallback?: string
  name?: string
}

/**
 * Resolves an icon to SVG. Icons named in `dashboard.yml` are baked into the
 * bundle at build time; icons picked in Settings come from the local-storage
 * cache the picker fills, so they survive going offline.
 */
export function useIconSvg(name: string | undefined): string | undefined {
  const { iconCache } = useStore()
  if (name === undefined) {
    return undefined
  }

  return baked[name] ?? iconCache[name]
}

export function Icon({ className, fallback, name }: IconProps) {
  const svg = useIconSvg(name)
  if (svg === undefined) {
    return <>{fallback}</>
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />
}

import { icons } from 'virtual:dashboard'

interface IconProps {
  className?: string
  name: string
}

/** Renders an icon baked into the bundle at build time. */
export function Icon({ className, name }: IconProps) {
  const svg = icons[name]
  if (!svg) {
    return null
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />
}

export function hasIcon(name: string | undefined): name is string {
  return name !== undefined && name in icons
}

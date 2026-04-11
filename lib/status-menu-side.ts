export type StatusMenuSide = 'top' | 'bottom'

const MENU_HEIGHT = 272
const VIEWPORT_PADDING = 16

type TriggerRect = Pick<DOMRect, 'top' | 'bottom'>

export function getStatusMenuSide(
  triggerRect: TriggerRect,
  viewportHeight: number,
): StatusMenuSide {
  const spaceAbove = triggerRect.top
  const spaceBelow = viewportHeight - triggerRect.bottom

  if (
    spaceBelow < MENU_HEIGHT + VIEWPORT_PADDING &&
    spaceAbove > spaceBelow
  ) {
    return 'top'
  }

  return 'bottom'
}

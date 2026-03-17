import { PropsWithChildren } from 'react'

type DragProps = {
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

type Props = PropsWithChildren<{
  /** Bal oldali felirat */
  label: string
  /** Jobb oldali (kézírásos) panel tartalma – ha nincs, a sor 2 oszlopos marad */
  inkPanel?: React.ReactNode
  /** Szerkesztő módban jelenjen meg a bal szélső megfogó */
  withHandle?: boolean
  /** Opcionális extra class */
  className?: string
  /** Drag-n-drop props (csak szerkesztőnél) */
  dragProps?: DragProps
  isLabel? : boolean
}>

/** Egységes sor a kitöltő és szerkesztő felületre – ugyanaz a markup és a CSS. */
export default function FieldRow({
  label,
  children,
  inkPanel,
  withHandle = false,
  className = '',
  dragProps,
  isLabel=true,
}: Props) {
  const hasInk = !!inkPanel
  const cls = `form-row ${withHandle ? 'with-handle' : ''} ${hasInk ? 'has-ink' : ''} ${className}`.trim()

  return (
    <div className={cls} {...(dragProps || {})}>
      {withHandle && <div className="drag-handle" title="Fogd meg és húzd">⋮⋮</div>}
      {isLabel && <label>{label}</label>}
      <div>{children}</div>
      {hasInk && <div>{inkPanel}</div>}
    </div>
  )
//   return (
//     <div className={cls} {...(dragProps || {})}>
//       {withHandle && <div className="drag-handle" title="Fogd meg és húzd">⋮⋮</div>}
//      <label className="field-row-label">{label}</label>
//       <div className="field-row-content">{children}</div>
//       {hasInk && <div className="field-row-ink">{inkPanel}</div>}
//     </div>
//   )
 }
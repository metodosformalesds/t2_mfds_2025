'use client'
import clsx from 'clsx'

export default function ModerationQueue({ items, selectedId, onSelectItem }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="font-inter text-base text-neutral-600">
          No hay ítems en la cola.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="flex flex-col gap-3">
        {items.map(item => {
          const isSelected = item.id === selectedId
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={clsx(
                'w-full cursor-pointer rounded-lg p-4 text-left transition-colors',
                isSelected
                  ? 'border-r-4 border-primary-500 bg-green-50'
                  : 'bg-neutral-100/50 hover:bg-neutral-200/70'
              )}
            >
              <h3 className="font-inter text-base font-semibold text-neutral-900">
                {item.title}
                {item.pendingCount > 0 && ` (${item.pendingCount} pendientes)`}
              </h3>
              <p className="font-inter text-base text-neutral-700">
                Publicado por: ‘{item.publisher}’
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
import './day-modal.css'

import { Overlay } from './modal-overlay'
import { EntryInput, EventRow, TaskRow } from './rows'
import { useStore } from '../store'

export function DayModal() {
  const { addEvent, addTask, closeDay, day, events, removeEvent, removeTask, tasks, toggleTask } =
    useStore()

  if (!day) {
    return null
  }

  const date = new Date(`${day}T12:00:00`)
  const dayEvents = events
    .filter((event) => event.date === day)
    .sort((a, b) => a.at.localeCompare(b.at))
  const dayTasks = tasks.filter((task) => task.due === day)

  return (
    <Overlay label="Day detail" onClose={closeDay}>
      <div className="dialog">
        <div className="dialog__head">
          <div>
            <h2 className="dialog__title">
              {date.toLocaleDateString([], {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
                year: 'numeric',
              })}
            </h2>
            <p className="dialog__meta">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'} · {dayTasks.length} task
              {dayTasks.length === 1 ? '' : 's'}
            </p>
          </div>
          <button aria-label="Close" className="dialog__close" onClick={closeDay} type="button">
            ×
          </button>
        </div>

        <div className="dialog__section">
          <h3 className="label">Events</h3>
          {dayEvents.map((event) => (
            <EventRow event={event} key={event.id} onRemove={removeEvent} />
          ))}
          <EntryInput
            className="inline-input"
            onSubmit={(value) => addEvent(value, day)}
            placeholder="09:30 Title — press ⏎"
          />
        </div>

        <div className="dialog__section">
          <h3 className="label">Tasks due</h3>
          {dayTasks.map((task) => (
            <TaskRow key={task.id} onRemove={removeTask} onToggle={toggleTask} task={task} />
          ))}
          <EntryInput
            className="inline-input"
            onSubmit={(value) => addTask(value, day)}
            placeholder="Add a task for this day — press ⏎"
          />
        </div>
      </div>
    </Overlay>
  )
}

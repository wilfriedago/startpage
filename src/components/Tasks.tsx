import { Panel } from "./Panel";
import { EntryInput, TaskRow } from "./rows";
import { useStore } from "../store";

export function Tasks() {
  const { addTask, removeTask, taskRef, tasks, toggleTask } = useStore();
  const open = tasks.filter((task) => !task.done).length;

  return (
    <Panel meta={`${open} open`} tightHead title="Tasks">
      <div className="rows">
        {tasks.map((task) => (
          <TaskRow key={task.id} onRemove={removeTask} onToggle={toggleTask} task={task} />
        ))}
      </div>
      <EntryInput
        className="inline-input inline-input--tight"
        onSubmit={(value) => addTask(value)}
        placeholder="Add a task — press ⏎"
        ref={taskRef}
      />
    </Panel>
  );
}

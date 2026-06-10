import { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';
import { toDatetimeLocalValue } from '../utils/taskHelpers';

const TaskForm = ({ onSubmit, onCancel, editTask, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    due_date: '',
  });

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        status: editTask.status,
        due_date: toDatetimeLocalValue(editTask.due_date),
      });
    } else {
      setFormData({ title: '', description: '', status: 'pending', due_date: '' });
    }
  }, [editTask]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
    >
      <h2 className="text-lg font-semibold mb-4">
        {editTask ? 'Edit Task' : 'Add New Task'}
      </h2>
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Enter task title"
        required
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Enter task description (optional)"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Due Date & Time
        </label>
        <input
          type="datetime-local"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          Tasks approaching or past due are highlighted automatically
        </p>
      </div>
      {editTask && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {editTask ? 'Update Task' : 'Add Task'}
        </Button>
        {editTask && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;

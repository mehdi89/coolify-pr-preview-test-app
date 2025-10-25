'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { todosApi, authApi } from '@/lib/api';
import type { Todo } from '@/lib/types';

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadTodos();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      router.push('/login');
    }
  };

  const loadTodos = async () => {
    try {
      const data = await todosApi.getAll();
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      await todosApi.create({ title: newTodo });
      setNewTodo('');
      await loadTodos();
    } catch (error) {
      console.error('Failed to create todo');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await todosApi.toggle(id);
      await loadTodos();
    } catch (error) {
      console.error('Failed to toggle todo');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await todosApi.delete(id);
      await loadTodos();
    } catch (error) {
      console.error('Failed to delete todo');
    }
  };

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Todos</h1>
            {user && <p className="text-gray-600 dark:text-gray-400">Welcome, {user.username}!</p>}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No todos yet. Create one above!</p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <p className={`${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-sm text-gray-500 mt-1">{todo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await loginUser(formData);
      const { id, name, email, token, onboarding_completed } = res.data.data;
      login({ id, name, email, onboarding_completed: !!onboarding_completed }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-slate-500 mb-6">Sign in to manage your tasks</p>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Login
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Register here
          </Link>
        </p>

        <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
          <p className="font-medium mb-1">Sample login:</p>
          <p>john@example.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

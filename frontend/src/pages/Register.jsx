import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      const { id, name, email, token } = res.data.data;
      login({ id, name, email, onboarding_completed: false }, token);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Create Account
        </h1>
        <p className="text-center text-slate-500 mb-6">Start organizing your tasks today</p>

        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} />

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
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
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

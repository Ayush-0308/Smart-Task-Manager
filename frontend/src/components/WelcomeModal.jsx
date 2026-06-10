import { useState } from 'react';
import Button from './Button';

const WelcomeModal = ({ onComplete, onClose }) => {
  const [step, setStep] = useState('choose');
  const [teamAction, setTeamAction] = useState('create');
  const [workspaceName, setWorkspaceName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (payload) => {
    setLoading(true);
    setError('');
    try {
      await onComplete(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome! 👋</h2>
        <p className="text-slate-500 mb-6">How would you like to work?</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => submit({ choice: 'individual' })}
              disabled={loading}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition"
            >
              <span className="text-2xl">👤</span>
              <p className="font-semibold text-slate-800 mt-2">Individual Workspace</p>
              <p className="text-sm text-slate-500">Private tasks visible only to you</p>
            </button>
            <button
              type="button"
              onClick={() => setStep('team')}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition"
            >
              <span className="text-2xl">👥</span>
              <p className="font-semibold text-slate-800 mt-2">Team Workspace</p>
              <p className="text-sm text-slate-500">Collaborate with a shared room code</p>
            </button>
            <button
              type="button"
              onClick={() => submit({ choice: 'skip' })}
              disabled={loading}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 'team' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTeamAction('create')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  teamAction === 'create' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Create Team
              </button>
              <button
                type="button"
                onClick={() => setTeamAction('join')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  teamAction === 'join' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Join with Code
              </button>
            </div>

            {teamAction === 'create' ? (
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Team workspace name"
                className="w-full px-4 py-2 border rounded-lg"
              />
            ) : (
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character room code"
                maxLength={8}
                className="w-full px-4 py-2 border rounded-lg uppercase tracking-widest"
              />
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button
                loading={loading}
                onClick={() =>
                  submit({
                    choice: 'team',
                    workspace_name: workspaceName,
                    room_code: teamAction === 'join' ? roomCode : undefined,
                  })
                }
              >
                {teamAction === 'create' ? 'Create Workspace' : 'Join Workspace'}
              </Button>
            </div>
          </div>
        )}

        {!loading && step === 'choose' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default WelcomeModal;

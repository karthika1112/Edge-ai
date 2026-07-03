import React, { useState } from 'react';

export const MicrosoftLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Allow only the valid mock credentials
      if (email === 'operator@edgeshield.ai' && password === 'password123') {
        // Successful login: redirect back to redirectUri with mock authorization code
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUri = searchParams.get('redirect_uri') || (window.location.origin + '/login');
        
        // Append auth code and state
        const callbackUrl = `${redirectUri}?code=mock_entra_auth_code_xyz&state=${searchParams.get('state') || ''}`;
        window.location.href = callbackUrl;
      } else {
        setError('Incorrect password or user does not exist in this domain. Please try again.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#E5E5E5] font-sans text-[#1B1B1B]">
      <div className="bg-white max-w-[440px] w-full p-11 border border-[#D2D2D2] shadow-md flex flex-col justify-between min-h-[380px]">
        <div>
          {/* Microsoft Logo (standard layout) */}
          <div className="flex items-center gap-1.5 mb-6">
            <div className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px]">
              <div className="bg-[#F25022] w-2 h-2" />
              <div className="bg-[#7FBA00] w-2 h-2" />
              <div className="bg-[#00A1F1] w-2 h-2" />
              <div className="bg-[#FFB900] w-2 h-2" />
            </div>
            <span className="font-semibold text-[15px] text-[#737373] tracking-tight">Microsoft</span>
          </div>

          <h2 className="text-xl font-semibold text-[#1B1B1B] mb-4">Sign in</h2>
          
          {error && (
            <p className="text-[12.5px] text-[#E81123] mb-3 leading-tight">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email, phone, or Skype"
              className="w-full px-3 py-2 border-b border-[#666] focus:border-[#0067B8] outline-none text-[15px] placeholder-[#666]"
            />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border-b border-[#666] focus:border-[#0067B8] outline-none text-[15px] placeholder-[#666]"
            />
            
            <div className="text-[13px] text-[#505050] space-y-3 pt-2">
              <p>No account? <a href="#create" className="text-[#0067B8] hover:underline">Create one!</a></p>
              <p>Can’t access your account? <a href="#cant" className="text-[#0067B8] hover:underline">Can’t access your account?</a></p>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="px-8 py-1.5 bg-[#CCCCCC] hover:bg-[#B3B3B3] text-black text-sm font-normal min-w-[94px] text-center"
          >
            Back
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-1.5 bg-[#0067B8] hover:bg-[#005DA6] text-white text-sm font-normal min-w-[94px] text-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrosoftLogin;

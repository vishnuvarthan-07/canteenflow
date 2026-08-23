import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Soup, Zap, Store } from 'lucide-react';
import { PageIntro, Button } from './App';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [hostel, setHostel] = useState<'boys' | 'girls'>('boys');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              department,
              hostel
            }
          }
        });
        if (error) throw error;
        setSuccess("Registration Submitted! Your account is waiting for admin approval. You will be able to access CanteenFlow after your account is approved.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain min-h-[100dvh] bg-[#f7f0e5] flex flex-col justify-center items-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e3d7c5] p-8 animate-rise">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f6cb63] text-[#173f37]">
              <Soup size={22} />
            </span>
            <span className="text-2xl font-bold text-[#173f37]">
              Canteen<span className="text-[#ea6b42]">Flow</span>
            </span>
          </div>
        </div>

        <PageIntro title={isLogin ? "Welcome back" : "Create Account"} sub={isLogin ? "Sign in to order your favorite meals." : "Register to access the canteen."} />

        {error && <div className="mb-4 rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl bg-green-100 p-3 text-sm text-green-800 font-bold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Full Name
                <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="e.g. Aarav Shah" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Phone Number
                  <input required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="10-digit number" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Hostel
                  <select value={hostel} onChange={e => setHostel(e.target.value as any)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm">
                    <option value="boys">Boys Hostel</option>
                    <option value="girls">Girls Hostel</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Department
                <input value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="e.g. Computer Science" />
              </label>
            </>
          )}

          <label className="flex flex-col text-xs font-bold text-[#294b41]">Email
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="your@email.com" />
          </label>
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Password
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="••••••" />
          </label>
          
          {!isLogin && (
            <label className="flex flex-col text-xs font-bold text-[#294b41]">Confirm Password
              <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 h-11 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="••••••" />
            </label>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-6 h-12 text-[15px]">
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm font-bold text-[#88735d]">
          {isLogin ? "New Student? " : "Already registered? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#ea6b42] hover:underline">
            {isLogin ? "Create Account" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PendingApprovalPage() {
  return (
    <div className="grain min-h-[100dvh] bg-[#f7f0e5] flex flex-col justify-center items-center p-5 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e3d7c5] p-10 animate-rise">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-[#f6cb63]/30 text-[#e0a61f]">
          <Store size={32} />
        </div>
        <h2 className="font-display text-3xl text-[#294b41] mb-4">Registration Pending</h2>
        <p className="text-[#7b614b] mb-8">
          Your account is waiting for admin approval. You will be able to access CanteenFlow after an administrator approves your registration.
        </p>
        <Button onClick={() => supabase.auth.signOut()} variant="outline" className="w-full">Sign Out</Button>
      </div>
    </div>
  );
}

export function RejectedPage() {
  return (
    <div className="grain min-h-[100dvh] bg-[#f7f0e5] flex flex-col justify-center items-center p-5 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e3d7c5] p-10 animate-rise">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-red-100 text-red-600">
          <Zap size={32} />
        </div>
        <h2 className="font-display text-3xl text-red-700 mb-4">Registration Not Approved</h2>
        <p className="text-[#7b614b] mb-8">
          Your registration was not approved. Please contact the canteen administrator for more information.
        </p>
        <Button onClick={() => supabase.auth.signOut()} variant="outline" className="w-full">Sign Out</Button>
      </div>
    </div>
  );
}

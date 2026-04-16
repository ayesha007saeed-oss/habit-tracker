import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Trash2, Play, Pause, CheckCircle, BarChart3, LayoutDashboard, Plus, Sun, Moon, Zap, LogOut, PieChart } from 'lucide-react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [habits, setHabits] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [newHabitName, setNewHabitName] = useState('');
  const [inputHours, setInputHours] = useState(1);   
  const [inputMins, setInputMins] = useState(0);    
  const [priority, setPriority] = useState('Medium');
  const [newHabitDate, setNewHabitDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
  }, [user]);

  useEffect(() => {
    let interval;
    if (habits.some(h => h.isActive)) {
      interval = setInterval(() => {
        setHabits(prev => prev.map(h => 
          h.isActive && h.timeLeft > 0 ? { ...h, timeLeft: h.timeLeft - 1 } : h
        ));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [habits]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert(err.message); }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const totalSeconds = (parseInt(inputHours || 0) * 3600) + (parseInt(inputMins || 0) * 60);
    
    await addDoc(collection(db, "habits"), {
      name: newHabitName,
      priority: priority,
      timeLeft: totalSeconds,
      totalTime: totalSeconds, // Saved to calculate percentage
      isActive: false,
      userId: user.uid,
      date: newHabitDate
    });

    setNewHabitName('');
    setInputHours(1);
    setInputMins(0);
    setNewHabitDate(new Date().toISOString().split('T')[0]);
  };

  const toggleHabit = async (habit) => {
    await updateDoc(doc(db, "habits", habit.id), { isActive: !habit.isActive });
  };

  const deleteHabit = async (id) => {
    await deleteDoc(doc(db, "habits", id));
  };

  const formatSeconds = (totalSeconds) => {
    if (isNaN(totalSeconds)) return "0h 0m 0s";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <div className="sidebar-brand" style={{justifyContent: 'center', marginBottom: '20px'}}>
            <CheckCircle className="brand-icon" /> HabitUp Pro
          </div>
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuth} className="auth-form">
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
            <button className="primary-btn" type="submit">{isSignUp ? 'Sign Up' : 'Login'}</button>
          </form>
          <p className="auth-footer" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Login' : 'New here? Create account'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <nav className="sidebar">
        <div className="sidebar-brand">
          <CheckCircle className="brand-icon" />
          <span>HabitUp Pro</span>
        </div>
        <div className="nav-menu">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'active' : ''}>
            <PieChart size={20} /> Progress
          </button>

          <button onClick={() => setActiveTab('progress')} className={activeTab === 'progress' ? 'active' : ''}>
            <BarChart3 size={20} /> Analytics
          </button>
          
          <button onClick={() => signOut(auth)} className="logout-btn-nav">
             <LogOut size={20} /> Logout
          </button>
        </div>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </nav>

      <main className="content-area">
        <header className="content-header">
          <div>
            <h1>{activeTab === 'dashboard' ? 'Daily Dashboard' : activeTab === 'stats' ? 'Habit Progress' : 'Analytics'}</h1>
            <p className="subtitle">Precision in every hour.</p>
          </div>
          <div className="header-badge"><Zap size={14} /> Live Better</div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            <div className="card create-card">
              <h3>New Goal</h3>
              <form onSubmit={addHabit} className="habit-form">
                <div className="form-group">
                  <label>Habit Name</label>
                  <input type="text" placeholder="e.g. Learning React" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} />
                </div>
                
                <div className="duration-priority-row">
                  <div className="form-group flex-2">
                    <label>Duration</label>
                    <div className="time-input-grid">
                        <div className="time-sub-input">
                            <input type="number" min="0" value={inputHours} onChange={(e) => setInputHours(e.target.value)} />
                            <span>hr</span>
                        </div>
                        <div className="time-sub-input">
                            <input type="number" min="0" max="59" value={inputMins} onChange={(e) => setInputMins(e.target.value)} />
                            <span>min</span>
                        </div>
                    </div>
                  </div>
                  <div className="form-group flex-1">
                    <label>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={newHabitDate} onChange={(e) => setNewHabitDate(e.target.value)} />
                </div>

                <button type="submit" className="primary-btn"><Plus size={18}/> Add Habit</button>
              </form>
            </div>

            <div className="habit-container">
              <div className="habit-grid">
                {habits.map(habit => (
                  <div key={habit.id} className={`habit-card-pro ${habit.priority?.toLowerCase() || 'medium'}`}>
                    <div className="habit-header">
                      <span className="priority-tag">{habit.priority}</span>
                      <div className="habit-actions">
                        <button className={`icon-btn action-btn ${habit.isActive ? 'pause-mode' : 'play-mode'}`} onClick={() => toggleHabit(habit)}>
                          {habit.isActive ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button className="icon-btn action-btn delete-mode" onClick={() => deleteHabit(habit.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h4>{habit.name}</h4>
                    <div className="habit-footer">
                      <span className="time-display">{formatSeconds(habit.timeLeft)}</span>
                      <span className="date-display">{habit.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'stats' ? (
          <div className="stats-view">
            <div className="card">
              <h3>Completion Overview</h3>
              <div className="progress-list">
                {habits.map(habit => {
                  const completed = habit.totalTime - habit.timeLeft;
                  const percent = Math.min(100, Math.round((completed / habit.totalTime) * 100)) || 0;
                  return (
                    <div key={habit.id} className="progress-item">
                      <div className="progress-info">
                        <span>{habit.name}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">Detailed charts coming soon...</div>
        )}
      </main>
    </div>
  );
};

export default App;
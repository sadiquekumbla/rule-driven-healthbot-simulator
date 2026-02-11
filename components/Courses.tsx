
import React, { useState, useMemo } from 'react';
import { Client, Course } from '../types';
import { INITIAL_COURSES } from '../constants';
import { Target, Zap, Clock, ShieldCheck, ArrowRight, Plus, Trash2, Edit3, X, Save, CheckCircle2 } from 'lucide-react';

interface CoursesProps {
  activeClient: Client | null;
}

const Courses: React.FC<CoursesProps> = ({ activeClient }) => {
  const [allCourses, setAllCourses] = useState<Course[]>(INITIAL_COURSES);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);

  const matchedCourses = useMemo(() => {
    if (!activeClient) return allCourses;
    const bmi = activeClient.context.bmi;
    if (bmi === null) return allCourses;

    return allCourses.filter(c => {
      const minMatch = c.minBmi === undefined || bmi >= c.minBmi;
      const maxMatch = c.maxBmi === undefined || bmi <= c.maxBmi;
      return minMatch && maxMatch;
    });
  }, [activeClient, allCourses]);

  const recommendedId = activeClient?.context.suggestedCourse;

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    if (allCourses.find(c => c.id === editingCourse.id)) {
      setAllCourses(prev => prev.map(c => c.id === editingCourse.id ? editingCourse : c));
    } else {
      setAllCourses(prev => [...prev, editingCourse]);
    }
    setShowModal(false);
    setEditingCourse(null);
  };

  const deleteCourse = (id: string) => {
    if (confirm('Delete this course?')) {
      setAllCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const openAdd = () => {
    setEditingCourse({
      id: `c-${Date.now()}`,
      title: '',
      description: '',
      price: 0,
      category: '',
      duration: '',
      essentials: []
    });
    setShowModal(true);
  };

  const addEssential = () => {
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, essentials: [...editingCourse.essentials, ''] });
    }
  };

  const updateEssential = (index: number, val: string) => {
    if (editingCourse) {
      const updated = [...editingCourse.essentials];
      updated[index] = val;
      setEditingCourse({ ...editingCourse, essentials: updated });
    }
  };

  const removeEssential = (index: number) => {
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, essentials: editingCourse.essentials.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-wa-bg p-8 space-y-10 scrollbar-hide relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-wa-text tracking-tight mb-2">Course Marketplace</h2>
          <p className="text-wa-muted font-medium">Curated health programs matching your client's profile.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isAdminMode ? 'bg-wa-accent text-wa-bg' : 'bg-wa-surface border border-wa-border text-wa-muted'}`}
          >
            {isAdminMode ? 'Admin Mode: ON' : 'Manage Courses'}
          </button>
          {isAdminMode && (
            <button onClick={openAdd} className="bg-wa-accent text-wa-bg w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-wa-accent/20">
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {(isAdminMode ? allCourses : matchedCourses).map(course => {
          const isRecommended = course.title === recommendedId;
          return (
            <div 
              key={course.id} 
              className={`relative bg-wa-surface border rounded-[32px] p-8 flex flex-col justify-between group transition-all duration-500 hover:border-wa-accent/50 hover:shadow-2xl ${
                isRecommended ? 'border-wa-accent ring-1 ring-wa-accent/50' : 'border-wa-border'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-8 bg-wa-accent text-wa-bg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-10">
                  AI Recommended
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    course.category === 'medical' ? 'bg-rose-500/10 text-rose-500' : 'bg-wa-accent/10 text-wa-accent'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  {isAdminMode && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCourse(course); setShowModal(true); }} className="p-2 bg-wa-bg rounded-lg text-wa-muted hover:text-wa-accent"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCourse(course.id)} className="p-2 bg-wa-bg rounded-lg text-wa-muted hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-wa-text mb-2 tracking-tight">{course.title}</h3>
                <p className="text-sm text-wa-muted mb-6 leading-relaxed font-medium line-clamp-2">{course.description}</p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-[11px] font-bold text-wa-muted uppercase tracking-tighter">
                    <Clock className="w-4 h-4 text-wa-accent opacity-60" /> {course.duration}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-wa-muted uppercase tracking-tighter">
                    <Target className="w-4 h-4 text-wa-accent opacity-60" /> BMI Range: {course.minBmi || '0'}+ {course.maxBmi ? `- ${course.maxBmi}` : ''}
                  </div>
                </div>

                {course.essentials.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-black text-wa-muted uppercase tracking-widest">Essentials Needed</p>
                    <div className="flex flex-wrap gap-2">
                      {course.essentials.map((ess, idx) => (
                        <span key={idx} className="bg-wa-bg border border-wa-border px-3 py-1 rounded-lg text-[10px] font-bold text-wa-text/80">{ess}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-8 border-t border-wa-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-wa-muted uppercase tracking-widest mb-1">Tuition</p>
                  <p className="text-2xl font-black text-wa-accent">₹{course.price}</p>
                </div>
                <button className="bg-wa-accent text-wa-bg p-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-wa-accent/20">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && editingCourse && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-wa-surface border border-wa-border w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-wa-border flex justify-between items-center shrink-0">
              <h3 className="text-xl font-black text-wa-text uppercase tracking-tight">Modify Program</h3>
              <X onClick={() => setShowModal(false)} className="w-6 h-6 text-wa-muted cursor-pointer hover:text-wa-text" />
            </div>
            <form onSubmit={handleSaveCourse} className="p-8 overflow-y-auto space-y-6 scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Course Title</label>
                  <input required value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Category</label>
                  <input 
                    required 
                    list="category-options"
                    value={editingCourse.category} 
                    onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} 
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-bold"
                    placeholder="e.g. Weight Loss"
                  />
                  <datalist id="category-options">
                    <option value="weight-loss" />
                    <option value="muscle-gain" />
                    <option value="maintenance" />
                    <option value="medical" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-wa-muted uppercase">Description</label>
                <textarea required rows={3} value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-medium" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Price (₹)</label>
                  <input type="number" required value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: Number(e.target.value)})} className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Min BMI</label>
                  <input type="number" step="0.1" value={editingCourse.minBmi || ''} onChange={e => setEditingCourse({...editingCourse, minBmi: Number(e.target.value) || undefined})} className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Duration</label>
                  <input required placeholder="e.g. 10 Weeks" value={editingCourse.duration} onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})} className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-sm font-bold" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-wa-muted uppercase">Essential Requirements</label>
                  <button type="button" onClick={addEssential} className="text-wa-accent text-[10px] font-black flex items-center gap-1"><Plus className="w-3 h-3" /> ADD</button>
                </div>
                <div className="space-y-2">
                  {editingCourse.essentials.map((ess, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={ess} onChange={e => updateEssential(idx, e.target.value)} className="flex-1 bg-wa-bg border border-wa-border p-2 rounded-xl text-xs font-medium" />
                      <button type="button" onClick={() => removeEssential(idx)} className="text-rose-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-wa-accent text-wa-bg font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-wa-accent/20 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;

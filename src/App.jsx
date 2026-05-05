import React, { useState, useEffect, useMemo } from 'react'
import { WEEKS } from './data/weeks'

const STATE_KEY = 'vora_timeline_v1'

const App = () => {
  // State
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STATE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [username, setUsername] = useState(() => localStorage.getItem('vora_username') || '')
  const [activeFilter, setActiveFilter] = useState('all')
  const [openWeeks, setOpenWeeks] = useState(new Set([1])) // Start with Week 1 open
  const [showModal, setShowModal] = useState(!localStorage.getItem('vora_username'))

  // Persistence
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(checkedItems))
  }, [checkedItems])

  useEffect(() => {
    if (username) {
      localStorage.setItem('vora_username', username)
    }
  }, [username])

  // Helper: itemKey
  const getItemKey = (wk, tab, section, idx) => `w${wk}_${tab}_${section}_${idx}`

  // Toggle Checkbox
  const toggleItem = (wk, tab, section, idx) => {
    const key = getItemKey(wk, tab, section, idx)
    setCheckedItems(prev => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = username || 'Anonymous'
      }
      return next
    })
  }

  const handleSetUsername = (name) => {
    setUsername(name)
    setShowModal(false)
  }

  // Reset All
  const resetAll = () => {
    if (window.confirm('Reset all checked items?')) {
      setCheckedItems({})
    }
  }

  // Stats Calculations
  const stats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0
    let weeksComplete = 0

    WEEKS.forEach(w => {
      let weekTotal = 0
      let weekDone = 0

      ;['fe', 'be'].forEach(tab => {
        Object.entries(w[tab]).forEach(([section, items]) => {
          items.forEach((_, idx) => {
            weekTotal++
            if (checkedItems[getItemKey(w.n, tab, section, idx)]) {
              weekDone++
            }
          })
        })
      })

      totalTasks += weekTotal
      completedTasks += weekDone
      if (weekTotal > 0 && weekTotal === weekDone) {
        weeksComplete++
      }
    })

    return {
      totalTasks,
      completedTasks,
      weeksComplete,
      pct: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }, [checkedItems])

  // Filter Logic
  const filteredWeeks = WEEKS.filter(w => {
    if (activeFilter === 'all') return true
    if (w.owner === activeFilter) return true
    if (activeFilter === 'talent' && w.owner === 'mixed') return true
    if (activeFilter === 'employer' && w.owner === 'mixed') return true
    return false
  })

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0D1B4B] font-sans selection:bg-blue-500/30">
      {showModal && <UsernameModal onSetUsername={handleSetUsername} />}
      <Header 
        progressText={`${stats.completedTasks} / ${stats.totalTasks} tasks done`} 
        onReset={resetAll} 
        username={username}
        onEditUser={() => setShowModal(true)}
      />
      
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <Hero activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        
        <StatsBar stats={stats} />
        
        <section className="flex flex-col gap-3 pb-20">
          {filteredWeeks.map(w => (
            <WeekCard 
              key={w.n} 
              week={w} 
              checkedItems={checkedItems} 
              toggleItem={toggleItem}
              isOpen={openWeeks.has(w.n)}
              toggleOpen={() => setOpenWeeks(prev => {
                const next = new Set(prev)
                if (next.has(w.n)) next.delete(w.n)
                else next.add(w.n)
                return next
              })}
            />
          ))}
        </section>
      </main>
    </div>
  )
}

const Header = ({ progressText, onReset, username, onEditUser }) => (
  <header className="sticky top-0 z-50 bg-white border-b border-[#E2E6EF] px-4 sm:px-8 h-14 flex items-center justify-between shadow-sm">
    <div className="font-syne font-extrabold text-base sm:text-lg tracking-widest text-[#1B4FCC] whitespace-nowrap">
      VORA <span className="hidden sm:inline ml-2 text-[#8492B4] font-normal text-[0.7rem] tracking-tight">Health Talent OS · 12-Week Delivery</span>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={onEditUser}
        className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#F0F2F8] hover:bg-[#E2E6EF] rounded-full transition-colors group"
      >
        <span className="font-dm-mono text-[0.6rem] text-[#8492B4] group-hover:text-[#1B4FCC]">USER:</span>
        <span className="font-dm-mono text-[0.65rem] font-bold text-[#1B4FCC]">{username || 'Guest'}</span>
      </button>
      <div className="hidden md:block font-dm-mono text-[0.67rem] bg-[#EEF3FF] border border-[#E2E6EF] text-[#1B4FCC] px-3 py-1 rounded-full font-medium">
        {progressText}
      </div>
      <button 
        onClick={onReset}
        className="font-dm-mono text-[0.63rem] border border-[#E2E6EF] text-[#8492B4] px-3 py-1 rounded-full cursor-pointer hover:border-[#1B4FCC] hover:text-[#1B4FCC] transition-all whitespace-nowrap"
      >
        Reset all
      </button>
    </div>
  </header>
)

const Hero = ({ activeFilter, setActiveFilter }) => (
  <section className="py-8 sm:py-12">
    <div className="font-dm-mono text-[0.6rem] tracking-[0.14em] text-[#1B4FCC] uppercase mb-2">
      Product Delivery Tracker · 5 May – 25 Jul 2026 · Mon–Fri
    </div>
    <h1 className="font-syne font-extrabold text-3xl sm:text-5xl leading-tight mb-2">
      12-Week Build Plan<br />
      <span className="text-[#1B4FCC]">Frontend + Backend</span>
    </h1>
    <p className="text-[#8492B4] text-sm max-w-[500px] mb-6">
      Check off deliverables as your team completes them. Progress saves automatically in your browser.
    </p>

    <div className="flex flex-wrap gap-2">
      <FilterChip label="ALL WEEKS" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} color="all" />
      <FilterChip label="EMPLOYER" active={activeFilter === 'employer'} onClick={() => setActiveFilter('employer')} color="employer" />
      <FilterChip label="TALENT" active={activeFilter === 'talent'} onClick={() => setActiveFilter('talent')} color="talent" />
      <FilterChip label="MENTOR" active={activeFilter === 'mentor'} onClick={() => setActiveFilter('mentor')} color="mentor" />
      <FilterChip label="LICENSING" active={activeFilter === 'licensing'} onClick={() => setActiveFilter('licensing')} color="licensing" />
    </div>
  </section>
)

const FilterChip = ({ label, active, onClick, color }) => {
  const themes = {
    all: {
      base: 'border-[#64748B] text-[#64748B]',
      active: 'bg-[#0D1B4B] border-[#0D1B4B] text-white',
      hover: 'hover:bg-[#F1F5F9]'
    },
    employer: {
      base: 'border-[#1B4FCC] text-[#1B4FCC]',
      active: 'bg-[#1B4FCC] border-[#1B4FCC] text-white',
      hover: 'hover:bg-[#EEF3FF]'
    },
    talent: {
      base: 'border-[#7C3AED] text-[#7C3AED]',
      active: 'bg-[#7C3AED] border-[#7C3AED] text-white',
      hover: 'hover:bg-[#F5F0FF]'
    },
    mentor: {
      base: 'border-[#0891B2] text-[#0891B2]',
      active: 'bg-[#0891B2] border-[#0891B2] text-white',
      hover: 'hover:bg-[#EFF9FC]'
    },
    licensing: {
      base: 'border-[#059669] text-[#059669]',
      active: 'bg-[#059669] border-[#059669] text-white',
      hover: 'hover:bg-[#ECFDF5]'
    },
  }

  const theme = themes[color]

  return (
    <button 
      onClick={onClick}
      className={`font-dm-mono text-[0.6rem] tracking-wider px-4 py-1.5 rounded-full border transition-all duration-200 ${
        active 
          ? theme.active 
          : `${theme.base} opacity-40 ${theme.hover}`
      }`}
    >
      {label}
    </button>
  )
}

const StatsBar = ({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
    <StatBlock val={stats.totalTasks} label="Total Tasks" />
    <StatBlock val={stats.completedTasks} label="Completed" />
    <StatBlock val={`${stats.pct}%`} label="Overall Progress" />
    <StatBlock val={`${stats.weeksComplete}/12`} label="Weeks Complete" />
  </div>
)

const StatBlock = ({ val, label }) => (
  <div className="bg-white border border-[#E2E6EF] rounded-xl p-4">
    <div className="font-syne font-extrabold text-2xl sm:text-3xl text-[#1B4FCC] leading-none mb-1">{val}</div>
    <div className="font-dm-mono text-[0.56rem] tracking-widest text-[#8492B4] uppercase">{label}</div>
  </div>
)

const WeekCard = ({ week, checkedItems, toggleItem, isOpen, toggleOpen }) => {
  const [activeTab, setActiveTab] = useState('fe')

  const total = useMemo(() => {
    let n = 0
    ;['fe', 'be'].forEach(tab => {
      Object.values(week[tab]).forEach(arr => { n += arr.length })
    })
    return n
  }, [week])

  const done = useMemo(() => {
    let n = 0
    ;['fe', 'be'].forEach(tab => {
      Object.entries(week[tab]).forEach(([section, items]) => {
        items.forEach((_, idx) => {
          if (checkedItems[`w${week.n}_${tab}_${section}_${idx}`]) n++
        })
      })
    })
    return n
  }, [week, checkedItems])

  const pct = total ? done / total : 0
  const dash = 88 - pct * 88

  const ownerColors = {
    all: '#64748B',
    employer: '#1B4FCC',
    talent: '#7C3AED',
    mentor: '#0891B2',
    licensing: '#059669',
    mixed: '#9333EA',
  }
  const color = ownerColors[week.owner]

  return (
    <div className={`week-card bg-white border border-[#E2E6EF] rounded-xl overflow-hidden transition-shadow hover:shadow-lg ${isOpen ? 'shadow-md' : ''}`}>
      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 cursor-pointer hover:bg-[#F0F2F8] transition-colors" onClick={toggleOpen}>
        <div className="font-syne font-extrabold text-lg sm:text-xl opacity-35" style={{ color }}>{week.label}</div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-bold text-sm sm:text-base truncate">{week.theme}</div>
          <div className="font-dm-mono text-[0.59rem] text-[#8492B4]">{week.dates}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block font-dm-mono text-[0.55rem] tracking-wider px-2 py-0.5 rounded-full border border-[#E2E6EF] bg-opacity-10 uppercase" style={{ color, borderColor: color, backgroundColor: `${color}1A` }}>
            {week.badge}
          </span>
          <div className="relative w-9 h-9">
            <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
              <circle className="ring-bg fill-none stroke-[#E2E6EF] stroke-[2.5]" cx="18" cy="18" r="14" />
              <circle 
                className="ring-fill fill-none stroke-[2.5] stroke-linecap-round" 
                cx="18" cy="18" r="14" 
                style={{ stroke: color, strokeDasharray: 88, strokeDashoffset: dash }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-dm-mono text-[0.5rem]">{done}/{total}</div>
          </div>
          <span className={`text-[#8492B4] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex border-b border-[#E2E6EF] mb-4 overflow-x-auto">
            <TabBtn active={activeTab === 'fe'} label="Frontend" onClick={() => setActiveTab('fe')} />
            <TabBtn active={activeTab === 'be'} label="Backend" onClick={() => setActiveTab('be')} />
            <TabBtn active={activeTab === 'screens'} label="Screens & APIs" onClick={() => setActiveTab('screens')} />
            <TabBtn active={activeTab === 'criteria'} label="Success Criteria" onClick={() => setActiveTab('criteria')} />
          </div>

          {activeTab === 'fe' && <Checklist week={week.n} tab="fe" data={week.fe} checkedItems={checkedItems} onToggle={toggleItem} color={color} />}
          {activeTab === 'be' && <Checklist week={week.n} tab="be" data={week.be} checkedItems={checkedItems} onToggle={toggleItem} color={color} />}
          {activeTab === 'screens' && (
            <div>
              <SectionLabel label="Screens + Endpoints" />
              <div className="flex flex-wrap gap-2 mt-2">
                {week.screens.map((s, i) => (
                  <span key={i} className={`font-dm-mono text-[0.58rem] px-2 py-0.5 rounded border border-[#E2E6EF] ${s.type === 'post' ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]' : s.type === 'page' ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6]' : 'bg-white text-[#1B4FCC]'}`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'criteria' && (
            <div>
              <SectionLabel label="Definition of Done" />
              <div className="flex flex-col gap-1 mt-2">
                {week.criteria.map((c, i) => (
                  <div key={i} className="flex gap-2 text-[0.8rem]">
                    <span className="text-[#1B4FCC] text-[0.68rem] mt-1">◆</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TabBtn = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`font-dm-mono text-[0.59rem] tracking-wider py-2 px-4 border-b-2 transition-all whitespace-nowrap ${active ? 'text-[#1B4FCC] border-[#1B4FCC]' : 'text-[#8492B4] border-transparent hover:text-[#0D1B4B]'}`}
  >
    {label}
  </button>
)

const Checklist = ({ week, tab, data, checkedItems, onToggle, color }) => (
  <div className="flex flex-col gap-4">
    {Object.entries(data).map(([section, items]) => (
      <div key={section}>
        <SectionLabel label={section} />
        <div className="flex flex-col gap-1 mt-1">
          {items.map((text, idx) => {
            const key = `w${week}_${tab}_${section}_${idx}`
            const done = !!checkedItems[key]
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3 p-1.5 rounded-lg cursor-pointer hover:bg-[#F0F2F8] transition-all`}
                onClick={() => onToggle(week, tab, section, idx)}
              >
                <div 
                  className={`w-[16px] h-[16px] border-2 rounded-[4px] flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${done ? 'text-white' : ''}`}
                  style={{ 
                    borderColor: color, 
                    backgroundColor: done ? color : 'transparent' 
                  }}
                >
                  {done && <span className="text-[10px] font-bold">✓</span>}
                </div>
                <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[0.8rem] leading-snug flex-1 ${done ? 'text-[#8492B4]' : ''}`}>
                  <span>{text}</span>
                  {done && checkedItems[key] && (
                    <span className="font-dm-mono text-[0.55rem] text-white bg-[#1B4FCC] px-1.5 py-0.5 rounded-md flex items-center gap-1 w-fit">
                      <span className="opacity-60 text-[0.5rem]">BY</span>
                      <span className="font-bold tracking-tight uppercase">{checkedItems[key]}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ))}
  </div>
)

const SectionLabel = ({ label }) => (
  <div className="font-dm-mono text-[0.56rem] tracking-[0.12em] uppercase text-[#1B4FCC] border-b border-[#E2E6EF] pb-1 mt-4">
    {label}
  </div>
)

const UsernameModal = ({ onSetUsername }) => {
  const [input, setInput] = useState('')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0D1B4B]/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-blue-900/20 border border-white/50 transform animate-in slide-in-from-bottom-8 duration-500">
        <div className="font-syne font-extrabold text-2xl text-[#1B4FCC] mb-2 tracking-tight">Identity Required</div>
        <p className="text-[#8492B4] text-sm mb-6">Enter your name or username to track your contributions to the Vora delivery timeline.</p>
        
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full bg-[#F4F6FB] border-2 border-transparent focus:border-[#1B4FCC] rounded-2xl px-6 py-4 outline-none transition-all font-dm-mono text-sm placeholder:text-[#8492B4]/50"
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && onSetUsername(input.trim())}
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
            <span className="text-[0.6rem] font-dm-mono text-[#1B4FCC] bg-[#EEF3FF] px-2 py-1 rounded-md">ENTER</span>
          </div>
        </div>

        <button 
          onClick={() => input.trim() && onSetUsername(input.trim())}
          disabled={!input.trim()}
          className="w-full mt-6 bg-[#1B4FCC] hover:bg-[#0D1B4B] disabled:bg-[#E2E6EF] disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          Access Timeline
        </button>
      </div>
    </div>
  )
}

export default App
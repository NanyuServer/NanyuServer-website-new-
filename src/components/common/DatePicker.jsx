import { useState, useMemo } from 'react'
import './DatePicker.css'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ value, onChange }) {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : now.getMonth())

  const years = useMemo(() => {
    const y = now.getFullYear()
    return Array.from({ length: 9 }, (_, i) => y - 4 + i)
  }, [])

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}月` }))
  }, [])

  const calendarDays = useMemo(() => {
    const totalDays = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth)
    const days = []

    // 上个月末尾的灰色日期
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        current: false,
        date: null
      })
    }

    // 当前月份的日期
    for (let d = 1; d <= totalDays; d++) {
      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ day: d, current: true, date: ds })
    }

    // 下个月开头的灰色日期
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, current: false, date: null })
    }

    return days
  }, [currentYear, currentMonth])

  const selectedStr = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : ''

  function handleYearChange(e) {
    const y = parseInt(e.target.value)
    setCurrentYear(y)
  }

  function handleMonthChange(e) {
    const m = parseInt(e.target.value)
    setCurrentMonth(m)
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  function pickDay(date) {
    if (!date) return
    const parts = date.split('-')
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    onChange && onChange(d)
  }

  return (
    <div className="dp-wrap">
      {/* 年月级联下拉框 */}
      <div className="dp-selectors">
        <select className="dp-select" value={currentYear} onChange={handleYearChange}>
          {years.map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select className="dp-select" value={currentMonth} onChange={handleMonthChange}>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* 翻页箭头 */}
      <div className="dp-header">
        <button className="dp-nav" onClick={prevMonth} type="button">‹</button>
        <span className="dp-title">{currentYear}年 {currentMonth + 1}月</span>
        <button className="dp-nav" onClick={nextMonth} type="button">›</button>
      </div>

      {/* 星期表头 */}
      <div className="dp-weekdays">
        {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
      </div>

      {/* 日期格子 */}
      <div className="dp-grid">
        {calendarDays.map((d, i) => (
          <button
            key={i}
            className={[
              'dp-day',
              !d.current && 'other-month',
              d.date === selectedStr && d.current && 'selected',
              d.date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` && 'today'
            ].filter(Boolean).join(' ')}
            onClick={() => pickDay(d.date)}
            disabled={!d.current}
            type="button"
          >
            {d.day}
          </button>
        ))}
      </div>
    </div>
  )
}

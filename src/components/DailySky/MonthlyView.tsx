import { useState, useMemo } from 'react';
import type { DailySkyDetail } from '../../hooks/useDailySky';
import './MonthlyView.css';

interface MonthlyViewProps {
  allDays: DailySkyDetail[];
  initialDate?: Date;
  onDateSelect: (date: string) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// Date型をローカルの YYYY-MM-DD に変換する関数
function toLocalYYYYMMDD(year: number, month: number, day: number) {
  const y = year.toString();
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function MonthlyView({ allDays, initialDate, onDateSelect }: MonthlyViewProps) {
  const initDate = initialDate ?? new Date();
  const [targetYear, setTargetYear] = useState(initDate.getFullYear());
  const [targetMonth, setTargetMonth] = useState(initDate.getMonth()); // 0-indexed

  // 日付の文字列(YYYY-MM-DD)をキーにして詳細を引けるようにする
  const daysMap = useMemo(() => {
    const map = new Map<string, DailySkyDetail>();
    for (const d of allDays) {
      map.set(d.date, d);
    }
    return map;
  }, [allDays]);

  // 今日より未来の日は（未来の予測ができないので）グレーアウト/クリック不可にするための設定
  const todayStr = toLocalYYYYMMDD(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const firstDay = new Date(targetYear, targetMonth, 1);
  const startDayOfWeek = firstDay.getDay();
  const lastDay = new Date(targetYear, targetMonth + 1, 0);
  const totalDaysInMonth = lastDay.getDate();

  const handlePrevMonth = () => {
    setTargetMonth((prev) => {
      if (prev === 0) {
        setTargetYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setTargetMonth((prev) => {
      if (prev === 11) {
        setTargetYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // セルの配列を作る
  const cells = [];
  // 先月分の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(<div key={`empty-start-${i}`} className="monthly-cell monthly-cell--empty" />);
  }
  // 当月分
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = toLocalYYYYMMDD(targetYear, targetMonth, d);
    const dayData = daysMap.get(dateStr);
    
    // まだ記録がない日（未来、または利用していない）
    const isFuture = dateStr > todayStr;
    const hasData = !!dayData && dayData.doneCount > 0;
    
    // 指定された「デフォルトの空の色」として dawn を割り当てる
    const phaseClass = hasData ? `sky-cell--${dayData.phase}` : 'sky-cell--default-dawn';

    const canClick = !isFuture && !!daysMap.get(dateStr); // allDays に含まれている日のみクリック可能

    cells.push(
      <button
        key={dateStr}
        className={`monthly-cell ${phaseClass} ${isFuture ? 'monthly-cell--future' : ''} ${!canClick ? 'monthly-cell--unclickable' : ''}`}
        onClick={() => {
          if (canClick) {
            onDateSelect(dateStr);
          }
        }}
        disabled={!canClick}
        title={dateStr}
      >
        <span className="monthly-cell-date">{d}</span>
        {hasData && <span className="monthly-cell-dot" />}
      </button>
    );
  }

  return (
    <div className="monthly-view-wrapper">
      <div className="monthly-header">
        <button className="monthly-nav-btn" onClick={handlePrevMonth}>◀︎</button>
        <div className="monthly-title">{targetYear}年 {targetMonth + 1}月</div>
        <button className="monthly-nav-btn" onClick={handleNextMonth}>▶︎</button>
      </div>

      <div className="monthly-calendar">
        <div className="monthly-weekdays">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="monthly-weekday">{wd}</div>
          ))}
        </div>
        <div className="monthly-grid">
          {cells}
        </div>
      </div>
    </div>
  );
}

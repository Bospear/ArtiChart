import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DebouncedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  delay?: number;
  className?: string;
}

const DebouncedNumberInput: React.FC<DebouncedNumberInputProps> = ({
  value,
  onChange,
  min,
  delay = 300,
  className,
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const scheduleCommit = useCallback(
    (raw: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const parsed = Number(raw);
        if (raw !== '' && !isNaN(parsed)) {
          const clamped = min !== undefined ? Math.max(min, parsed) : parsed;
          onChangeRef.current(clamped);
        }
      }, delay);
    },
    [delay, min]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      scheduleCommit(raw);
    },
    [scheduleCommit]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsFocused(false);
    setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      className={className}
      type="number"
      min={min}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};

export default DebouncedNumberInput;

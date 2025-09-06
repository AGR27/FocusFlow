import { useState } from "react";

interface BreakSatisfactionSliderProps {
  onChange: (value: number) => void;
  initialValue?: number;
}

export default function BreakSatisfactionSlider({
  onChange,
  initialValue = 0,
}: BreakSatisfactionSliderProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <label className="text-lg font-semibold whitespace-nowrap">How satisfactory was your break length?</label>
      <div className="flex flex-row items-center gap-2">
        <span className="text-lg font-semibold">Too Long</span>
        <input
          type="range"
          min="-10"
          max="10"
          value={value}
          onChange={handleChange}
          className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 flex-1"
        />
        <span className="text-lg font-semibold whitespace-nowrap">Too Long</span>
      </div>
      <div className="text-xl font-mono">{value}</div>
    </div>
  );
}
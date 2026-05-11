import React from 'react';
import styled from 'styled-components';

interface GlassRadioOption {
  id: string;
  label: string;
  gradient: string;
  glowColor: string;
}

interface GlassRadioGroupProps {
  name?: string;
  options?: GlassRadioOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const defaultOptions: GlassRadioOption[] = [
  {
    id: 'glass-silver',
    label: 'Silver',
    gradient: 'linear-gradient(135deg, #c0c0c055, #e0e0e0)',
    glowColor: 'rgba(192, 192, 192, 0.5)',
  },
  {
    id: 'glass-gold',
    label: 'Gold',
    gradient: 'linear-gradient(135deg, #ffd70055, #ffcc00)',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  {
    id: 'glass-platinum',
    label: 'Platinum',
    gradient: 'linear-gradient(135deg, #d0e7ff55, #a0d8ff)',
    glowColor: 'rgba(160, 216, 255, 0.5)',
  },
];

const GlassRadioGroup: React.FC<GlassRadioGroupProps> = ({
  name = 'plan',
  options = defaultOptions,
  defaultValue,
  value,
  onChange,
}) => {
  const selectedDefault = defaultValue || options[0]?.id || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <StyledWrapper $optionCount={options.length}>
      <div className="glass-radio-group">
        {options.map((option, index) => (
          <React.Fragment key={option.id}>
            <input
              type="radio"
              name={name}
              id={option.id}
              value={option.id}
              defaultChecked={!value ? option.id === selectedDefault : undefined}
              checked={value ? option.id === value : undefined}
              onChange={handleChange}
            />
            <label htmlFor={option.id}>{option.label}</label>
          </React.Fragment>
        ))}
        <div className="glass-glider" />
      </div>

      {/* Dynamic styles for each option's glider */}
      <style>{`
        ${options
          .map(
            (option, index) => `
          #${option.id}:checked ~ .glass-glider {
            transform: translateX(${index * 100}%);
            background: ${option.gradient};
            box-shadow:
              0 0 18px ${option.glowColor},
              0 0 10px ${option.glowColor.replace(/[\d.]+\)$/, '0.4)')} inset;
          }
        `
          )
          .join('\n')}
      `}</style>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $optionCount: number }>`
  .glass-radio-group {
    --bg: rgba(0, 0, 0, 0.04);
    --text: rgba(0, 0, 0, 0.4);

    display: flex;
    position: relative;
    background: var(--bg);
    border-radius: 1rem;
    backdrop-filter: blur(12px);
    box-shadow:
      inset 1px 1px 4px rgba(255, 255, 255, 0.2),
      inset -1px -1px 6px rgba(0, 0, 0, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    width: fit-content;
  }

  .glass-radio-group input {
    display: none;
  }

  .glass-radio-group label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    font-size: 14px;
    padding: 0.8rem 1.6rem;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--text);
    position: relative;
    z-index: 2;
    transition: color 0.3s ease-in-out;
  }

  .glass-radio-group label:hover {
    color: #000;
  }

  .glass-radio-group input:checked + label {
    color: #000;
  }

  .glass-glider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: calc(100% / ${(props) => props.$optionCount});
    border-radius: 1rem;
    z-index: 1;
    transition:
      transform 0.5s cubic-bezier(0.37, 1.95, 0.66, 0.56),
      background 0.4s ease-in-out,
      box-shadow 0.4s ease-in-out;
  }
`;

export default GlassRadioGroup;

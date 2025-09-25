'use client';

import {ChangeEvent} from 'react';

type BaseFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  description?: string;
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#1f2937'
};

const inputStyle: React.CSSProperties = {
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  padding: '0.6rem 0.75rem',
  fontSize: '1rem',
  backgroundColor: '#ffffff'
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 400,
  color: '#6b7280'
};

export function TextField({
  name,
  label,
  value,
  onChange,
  required,
  placeholder,
  description,
  type = 'text'
}: BaseFieldProps & { type?: 'text' | 'number' | 'email' | 'password' }) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label style={labelStyle}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        type={type}
        style={inputStyle}
      />
      {description ? <span style={descriptionStyle}>{description}</span> : null}
    </label>
  );
}

type DateFieldProps = BaseFieldProps & {
  min?: string;
  max?: string;
};

export function DateField({ name, label, value, onChange, required, min, max, description }: DateFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label style={labelStyle}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        required={required}
        style={inputStyle}
      />
      {description ? <span style={descriptionStyle}>{description}</span> : null}
    </label>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = BaseFieldProps & {
  options: SelectOption[];
};

export function SelectField({
  name,
  label,
  value,
  onChange,
  required,
  options,
  placeholder,
  description
}: SelectFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <label style={labelStyle}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        required={required}
        style={{ ...inputStyle, appearance: 'none' }}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? <span style={descriptionStyle}>{description}</span> : null}
    </label>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
};

export function CheckboxField({ name, label, checked, onChange, description }: CheckboxFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center' }}>
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        style={{ width: '1.25rem', height: '1.25rem' }}
      />
      <span style={{ fontWeight: 600 }}>{label}</span>
      {description ? <span style={descriptionStyle}>{description}</span> : null}
    </label>
  );
}

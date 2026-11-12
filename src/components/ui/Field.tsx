import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface FieldWrapperProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ id, label, error, hint, required, children, className }: FieldWrapperProps) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
          {required ? <span className="ms-1 text-lime">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, hint, leading, trailing, className, required, ...rest },
  ref,
) {
  const fieldId = id ?? rest.name ?? 'input';
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-text-secondary">
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(
            'field',
            leading ? 'ps-10' : undefined,
            trailing ? 'pe-11' : undefined,
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...rest}
        />
        {trailing ? <span className="absolute inset-y-0 end-2 flex items-center">{trailing}</span> : null}
      </div>
    </FieldWrapper>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, hint, options, className, required, ...rest },
  ref,
) {
  const fieldId = id ?? rest.name ?? 'select';
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn('field appearance-none bg-[right_1rem_center] pe-10', error && 'border-red-500/60', className)}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-ink-900">
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, error, hint, className, required, ...rest },
  ref,
) {
  const fieldId = id ?? rest.name ?? 'textarea';
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={3}
        aria-invalid={Boolean(error)}
        className={cn('field resize-y', error && 'border-red-500/60', className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { Input } from './input';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: string }

export function SearchInput({ label = 'Buscar no Orbit', ...props }: SearchInputProps) {
  return <div className="orbit-search"><Search size={18} aria-hidden="true" /><Input label={label} hideLabel type="search" placeholder="Buscar no Orbit..." autoComplete="off" {...props} /></div>;
}

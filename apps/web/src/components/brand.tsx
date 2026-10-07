import Link from 'next/link';
import { Orbit } from 'lucide-react';

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="orbit-brand" aria-label="Orbit — início"><span className="orbit-brand-symbol"><Orbit size={32} strokeWidth={1.8} aria-hidden="true" /></span><span>Orbit<span className="orbit-brand-dot">.</span></span></Link>;
}

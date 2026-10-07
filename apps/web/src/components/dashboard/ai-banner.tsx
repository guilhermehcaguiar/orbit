'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge, Button } from '@orbit/design-system';
import { PreviewDialog } from '../preview-dialog';

export function AiBanner() {
  const [open, setOpen] = useState(false);
  return <>
    <section className="ai-banner" aria-labelledby="ai-banner-title"><div className="orbital-art" aria-hidden="true"><span className="orbital-ring orbital-ring--one" /><span className="orbital-ring orbital-ring--two" /><span className="orbital-planet" /><span className="orbital-moon" /><span className="orbital-star"><Sparkles size={19} /></span></div><div className="ai-banner-copy"><Badge tone="primary"><Sparkles size={12} aria-hidden="true" />IA · Em breve</Badge><h2 id="ai-banner-title">Seu plano de estudos,<br />potencializado por IA.</h2><p>Em breve: recomendações personalizadas, resumos e materiais para apoiar seus estudos.</p></div><Button icon={<ArrowRight size={17} />} onClick={() => setOpen(true)}>Conhecer proposta</Button></section>
    <PreviewDialog id="ai-preview" open={open} onClose={() => setOpen(false)} title="Mais possibilidades para aprender" description="Recomendações, resumos e materiais reunidos para acompanhar seu ritmo. Em breve, no seu Orbit."><div className="ai-preview-icon"><Sparkles size={40} aria-hidden="true" /></div><Button onClick={() => setOpen(false)}>Continuar explorando</Button></PreviewDialog>
  </>;
}

import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Palette, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Identity = { brandName: string; logoUrl: string | null; logoPath: string | null; primaryColor: string; accentColor: string; backgroundColor: string };
const fallback: Identity = { brandName: "SUA MARCA", logoUrl: null, logoPath: null, primaryColor: "#ff7a22", accentColor: "#ffad36", backgroundColor: "#121313" };

export default function IdentityPanel({ onClose }: { onClose: () => void }) {
  const settings = trpc.identity.get.useQuery();
  const [form, setForm] = useState<Identity>(fallback);
  const [hydrated, setHydrated] = useState(false);
  const update = trpc.identity.update.useMutation({ onSuccess: next => { setForm(next); toast.success("Identidade visual salva"); }, onError: error => toast.error(error.message) });
  const upload = trpc.identity.uploadLogo.useMutation({ onSuccess: image => { setForm(current => ({ ...current, logoUrl: image.url, logoPath: image.path })); toast.success("Logo carregada"); }, onError: error => toast.error(error.message) });
  useEffect(() => { if (settings.data && !hydrated) { setForm(settings.data); setHydrated(true); } }, [settings.data, hydrated]);
  const change = (key: keyof Identity, value: string) => setForm(current => ({ ...current, [key]: value }));
  const onFile = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => upload.mutate({ base64: String(reader.result).split(",")[1] ?? "", mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" }); reader.readAsDataURL(file); };
  return <div className="identity-wrap"><button className="back-button" onClick={onClose}><ArrowLeft size={14} /> Voltar para páginas</button><div className="identity-grid"><section className="panel-card identity-card"><div className="section-heading"><div><p className="eyebrow">SISTEMA DA MARCA</p><h2>Identidade visual</h2><p className="identity-intro">Defina os elementos que aparecem automaticamente nas novas páginas.</p></div><Palette className="accent-icon" size={22} /></div><div className="identity-form"><label>Nome da marca<Input value={form.brandName} onChange={e => change("brandName", e.target.value)} placeholder="SUA MARCA" /></label><div><label className="field-label">Logo da marca</label><label className="logo-upload">{form.logoUrl ? <img src={form.logoUrl} alt="Logo" /> : <><ImagePlus size={25} /><span>Carregar logo</span><small>PNG transparente recomendado</small></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onFile(e.target.files?.[0])} /></label></div><div className="color-grid"><ColorField label="Cor principal" value={form.primaryColor} onChange={value => change("primaryColor", value)} /><ColorField label="Cor de destaque" value={form.accentColor} onChange={value => change("accentColor", value)} /><ColorField label="Cor do fundo" value={form.backgroundColor} onChange={value => change("backgroundColor", value)} /></div></div><div className="editor-actions"><Button variant="outline" onClick={() => setForm(fallback)}>Restaurar padrão</Button><Button className="cta-button" disabled={update.isPending} onClick={() => update.mutate(form)}><Save size={16} /> {update.isPending ? "Salvando..." : "Salvar identidade"}</Button></div></section><section className="identity-live" style={{ background: form.backgroundColor }}><p className="eyebrow">PRÉVIA AO VIVO</p><div className="identity-live-brand">{form.logoUrl ? <img src={form.logoUrl} alt="Logo" /> : <span><Sparkles size={15} /></span>} {form.brandName}</div><div className="identity-swatch"><div className="swatch-cover" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})` }} /><h3>Sua marca, reconhecível em cada clique.</h3><p>As cores e o logo definidos aqui serão aplicados às páginas públicas.</p><div className="identity-button" style={{ background: `linear-gradient(100deg, ${form.primaryColor}, ${form.accentColor})` }}>PARTICIPAR AGORA</div></div></section></div></div>;
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="color-field">{label}<div><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ff7a22"} onChange={e => onChange(e.target.value)} /><Input value={value} onChange={e => onChange(e.target.value)} maxLength={7} /></div></label>; }
export type { Identity };
export { fallback as defaultIdentity };

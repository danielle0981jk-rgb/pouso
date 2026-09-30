import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Link2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Mode = "landing" | "direct";
type Status = "active" | "inactive";
type Draft = {
  id?: number;
  name: string;
  slug: string;
  mode: Mode;
  landingPageId: number | null;
  destinationUrl: string;
  status: Status;
};

type Page = { id: number; title: string; slug: string; status: string };
const emptyDraft: Draft = { name: "", slug: "", mode: "direct", landingPageId: null, destinationUrl: "", status: "active" };

export default function ShortLinksPanel() {
  const [editing, setEditing] = useState<Draft | null>(null);
  const links = trpc.shortLinks.list.useQuery();
  const pages = trpc.landing.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.shortLinks.remove.useMutation({
    onSuccess: () => { toast.success("Link excluído"); utils.shortLinks.list.invalidate(); setEditing(null); },
    onError: error => toast.error(error.message),
  });
  const publishedPages = useMemo(() => (pages.data ?? []).filter(page => page.status === "published"), [pages.data]);

  if (editing) {
    return <ShortLinkEditor draft={editing} setDraft={setEditing} pages={publishedPages} onSaved={() => { setEditing(null); utils.shortLinks.list.invalidate(); }} onCancel={() => setEditing(null)} />;
  }

  return <section className="short-links-section">
    <div className="section-heading">
      <div><p className="eyebrow">WORKSPACE / LINKS</p><h1>Links curtos para cada campanha.</h1><p className="muted">Use um link para abrir uma landing Pouso ou redirecionar direto para o anúncio.</p></div>
      <Button className="cta-button" onClick={() => setEditing({ ...emptyDraft })}><Plus size={17} /> Novo link</Button>
    </div>
    {links.isLoading ? <div className="empty-state">Carregando links...</div> : links.data?.length ? <div className="short-links-list">
      {links.data.map(link => {
        const url = `${window.location.origin}/r/${link.slug}`;
        return <div className="short-link-row" key={link.id}>
          <div className="short-link-icon"><Link2 size={18} /></div>
          <div className="short-link-main"><strong>{link.name}</strong><small>{url}</small><span>{link.mode === "landing" ? "Página Pouso" : "URL direta"} · {link.clicks} cliques</span></div>
          <span className={`status-pill ${link.status === "active" ? "published" : "draft"}`}>{link.status === "active" ? "Ativo" : "Inativo"}</span>
          <div className="row-actions">
            <button title="Abrir link" onClick={() => window.open(url, "_blank")}><ExternalLink size={16} /></button>
            <button title="Copiar link" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link curto copiado"); }}><Copy size={16} /></button>
            <button title="Editar" onClick={() => setEditing({ id: link.id, name: link.name, slug: link.slug, mode: link.mode, landingPageId: link.landingPageId, destinationUrl: link.destinationUrl ?? "", status: link.status })}>Editar</button>
            <button className="danger" title="Excluir" onClick={() => { if (window.confirm("Excluir este link curto?")) remove.mutate({ id: link.id }); }}><Trash2 size={16} /></button>
          </div>
        </div>;
      })}
    </div> : <div className="empty-state"><Link2 size={26} /><h3>Seu primeiro link de anúncio começa aqui.</h3><p>Crie um slug curto e escolha se ele abre uma landing ou um destino direto.</p><Button className="cta-button" onClick={() => setEditing({ ...emptyDraft })}><Plus size={16} /> Criar primeiro link</Button></div>}
  </section>;
}

function ShortLinkEditor({ draft, setDraft, pages, onSaved, onCancel }: { draft: Draft; setDraft: (draft: Draft) => void; pages: Page[]; onSaved: () => void; onCancel: () => void }) {
  const create = trpc.shortLinks.create.useMutation({ onSuccess: () => { toast.success("Link curto criado"); onSaved(); }, onError: error => toast.error(error.message) });
  const update = trpc.shortLinks.update.useMutation({ onSuccess: () => { toast.success("Link curto atualizado"); onSaved(); }, onError: error => toast.error(error.message) });
  const busy = create.isPending || update.isPending;
  const submit = () => {
    const payload = { ...draft, landingPageId: draft.mode === "landing" ? draft.landingPageId : null, destinationUrl: draft.mode === "direct" ? draft.destinationUrl : null };
    if (draft.id) update.mutate({ ...payload, id: draft.id }); else create.mutate(payload);
  };
  return <section className="short-link-editor">
    <div className="section-heading"><div><p className="eyebrow">CONFIGURAÇÃO / LINK CURTO</p><h1>{draft.id ? "Editar link curto" : "Novo link curto"}</h1><p className="muted">Altere o destino depois sem precisar trocar o anúncio.</p></div><button className="icon-button" onClick={onCancel}><X size={18} /></button></div>
    <div className="panel-card short-link-form">
      <label>Nome interno<Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Campanha Facebook - verão" /></label>
      <label>Slug do link<div className="slug-input"><span>/r/</span><Input value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} placeholder="campanha-verao" /></div><small className="field-help">O slug vira o endereço curto usado no anúncio.</small></label>
      <label>Tipo de destino<select className="native-select" value={draft.mode} onChange={e => setDraft({ ...draft, mode: e.target.value as Mode, landingPageId: null, destinationUrl: "" })}><option value="direct">Somente link curto → URL direta</option><option value="landing">Link curto → Página Pouso</option></select></label>
      {draft.mode === "landing" ? <label>Página Pouso publicada<select className="native-select" value={draft.landingPageId ?? ""} onChange={e => setDraft({ ...draft, landingPageId: Number(e.target.value) || null })}><option value="">Selecione uma página</option>{pages.map(page => <option key={page.id} value={page.id}>{page.title} · /{page.slug}</option>)}</select></label> : <label>URL direta de destino<Input type="url" value={draft.destinationUrl} onChange={e => setDraft({ ...draft, destinationUrl: e.target.value })} placeholder="https://seu-destino.com" /></label>}
      <label>Status<select className="native-select" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Status })}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
      <div className="editor-actions"><Button variant="outline" disabled={busy} onClick={onCancel}><X size={16} /> Cancelar</Button><Button className="cta-button" disabled={busy} onClick={submit}><Save size={16} /> {busy ? "Salvando..." : "Salvar link"}</Button></div>
    </div>
  </section>;
}

import { useEffect } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { canClickCta, isMobileUserAgent } from "@shared/clickMode";

export default function PublicLanding({ slug }: { slug: string }) {
  const query = trpc.landing.getPublicBySlug.useQuery({ slug });
  const data = query.data;
  const isMobile = isMobileUserAgent(navigator.userAgent);
  
  useEffect(() => {
    if (data && !isMobile && data.desktopDestinationUrl) {
      window.location.replace(data.desktopDestinationUrl);
    }
  }, [data, isMobile]);

  const canClick = data ? canClickCta(data.clickMode, navigator.userAgent) : false;
  const isLoading = query.isLoading;
  const error = query.error;
  if (isLoading) return <main className="public-shell public-center"><div className="public-loader"><Sparkles size={20} /> Preparando sua experiência...</div></main>;
  if (error || !data) return <main className="public-shell public-center"><div className="not-found"><Sparkles size={18} /><h1>Página indisponível</h1><p>Este endereço pode ter sido removido ou ainda não foi publicado.</p><a href="/">Voltar ao início</a></div></main>;
  
  // Se for redirecionar, exibe um loader rápido pra não piscar a interface
  if (!isMobile && data.desktopDestinationUrl) return <main className="public-shell public-center"><div className="public-loader"><Sparkles size={20} /> Redirecionando...</div></main>;

  const targetUrl = data.destinationUrl;
  
  return <main className="public-shell" style={{ background: data.backgroundColor, color: data.textColor || "#ffffff" }}><div className="ambient-glow" /><section className="public-content">{data.logoUrl && <div className="public-brand"><img src={data.logoUrl} alt="Logo" /></div>}<div className="public-card"><div className="public-cover"><img src={data.coverImageUrl ?? ""} alt={data.title} /></div><div className="public-copy"><span className="public-kicker" style={{ color: data.textColor || "#ffffff" }}>{data.kickerText || "EDIÇÃO ATUAL"}</span><h1 style={{ color: data.textColor || "#ffffff" }}>{data.title}</h1><p style={{ color: data.textColor || "#ffffff" }}>{data.description || "Confira os detalhes e acesse o projeto completo."}</p>{canClick ? <a className="public-cta" style={{ background: `linear-gradient(100deg, ${data.primaryColor}, ${data.accentColor})`, color: data.buttonTextColor || "#ffffff" }} href={targetUrl}>{data.buttonLabel}<ArrowUpRight size={18} /></a> : <div className="public-cta public-cta-disabled" title="Disponível somente em dispositivos mobile">{data.buttonLabel}</div>}<div className="public-trust"><i /> {data.trustText || "AMBIENTE OFICIAL DA CAMPANHA"}</div></div></div><footer className="public-footer"><p style={{ color: data.textColor || "#ffffff" }}>© {new Date().getFullYear()} Projeto. Todos os direitos reservados.</p><small style={{ color: data.textColor || "#ffffff" }}>{data.footerText || "Este site é um ambiente independente. Ao seguir para o destino, a responsabilidade de navegação passa a ser exclusiva do domínio de destino."}</small></footer></section></main>;
}

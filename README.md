# Pouso Studio

Plataforma full-stack para criar, publicar e administrar múltiplas páginas de pouso com imagem de capa, título, CTA, destino final e URL curta exclusiva. O projeto está organizado em uma única pasta e usa React, Tailwind, Express, tRPC, Drizzle ORM e MySQL.

## O que está incluído

O painel possui autenticação administrativa por sessão HTTP-only, biblioteca de páginas, criação e edição de conteúdo, upload de capa em JPG/PNG/WEBP, salvamento de rascunho, publicação, exclusão, busca, cópia de link e prévia visual inspirada na referência fornecida. Cada publicação recebe um slug curto exclusivo. A página pública fica disponível em `/p/:slug` e o CTA usa navegação padrão sem `target`, abrindo o destino final na mesma aba. A seção **Links encurtados** permite criar um slug independente para abrir uma Página Pouso publicada ou uma URL direta de anúncio; o destino pode ser alterado depois sem trocar o link usado na campanha. Esses links usam a rota `/r/:slug`, redirecionamento HTTP na mesma aba e contagem de cliques.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `DATABASE_URL` | URL de conexão MySQL. No Railway, referencie `${{MySQL.MYSQL_URL}}` (recomendado). O app também aceita `MYSQL_URL`, `MYSQL_PUBLIC_URL` ou o conjunto `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`. |
| `JWT_SECRET` | Segredo longo e aleatório para assinar a sessão administrativa. |
| `ADMIN_EMAIL` | E-mail do administrador do painel. |
| `ADMIN_PASSWORD` | Senha forte do administrador. Não versionar este valor. |
| `UPLOAD_DIR` | Diretório legado de imagens antigas. Novos uploads usam o storage persistente da plataforma; se houver arquivos antigos locais, use `/data/uploads` com Volume Railway. |
| `PORT` | Definida automaticamente pelo Railway. O servidor não fixa a porta. |

## Implantação no Railway

Crie um projeto no Railway a partir deste repositório GitHub. Adicione um serviço MySQL ao mesmo projeto. No serviço web, crie `DATABASE_URL` com a referência `${{MySQL.MYSQL_URL}}`; esta é a opção recomendada e elimina o aviso mostrado no painel. Como alternativa, o código reconhece as variáveis nativas `MYSQL_URL`/`MYSQL_PUBLIC_URL` ou monta a URL com `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` e `MYSQLDATABASE`. Defina também `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `UPLOAD_DIR=/data/uploads` nas variáveis do serviço.

Novos uploads de capa e logo são enviados ao storage persistente da plataforma e retornam URLs `/manus-storage/...`, que continuam válidas após deploys e reinícios. O Volume Railway montado em `/data` só é necessário para manter arquivos antigos que ainda estejam referenciados por `/uploads/...`. O arquivo `railway.json` executa a compilação, roda `pnpm db:migrate` antes da inicialização para criar e atualizar as tabelas de forma idempotente e usa `/health` para o health check. As URLs públicas `/p/:slug` também recebem metadados `og:image` e Twitter para compartilhamento.

A configuração de código do Railway é mantida no arquivo `railway.json`. O Railway também permite ajustar os mesmos comandos no painel do serviço. Em produção, mantenha HTTPS ativado e não coloque credenciais em arquivos `.env` versionados.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Para verificar o projeto:

```bash
pnpm check
pnpm test
pnpm build
```

## Estrutura principal

`client/src/pages/Home.tsx` contém o painel e o editor. `client/src/pages/ShortLinksPanel.tsx` contém o módulo de links encurtados. `client/src/pages/PublicLanding.tsx` contém o template público. `server/routers/landing.ts` e `server/routers/shortLinks.ts` concentram as regras de slug, validação e procedures tRPC. `drizzle/schema.ts` define as tabelas. `server/uploads.ts` envia novos arquivos ao storage persistente e mantém compatibilidade com o diretório legado. O banco armazena metadados e referências; os bytes da imagem ficam no storage de arquivos.

## Referência visual

A composição foi traduzida para um sistema próprio: fundo carvão com glow discreto, card de imagem quadrado com moldura, tipografia clara, acento laranja, CTA em gradiente quente e rodapé compacto. A identidade e o conteúdo da campanha permanecem configuráveis, sem copiar logotipo ou ativos proprietários da referência.

# Deploy e Ambientes

## Ambientes
- local
- preview por PR
- staging
- production

## Produção sugerida
- Web: Vercel
- API: container em Railway/Render/Fly.io
- Banco/Auth/Storage: Supabase
- Redis: Upstash/managed Redis
- Observabilidade: Sentry + OpenTelemetry

## Variáveis

Separar variáveis por app. Nunca colocar service role key no browser.

## Migrações

- migrations versionadas no repositório;
- executar antes da nova API quando backward-compatible;
- preferir expand/contract em alterações arriscadas;
- backup antes de mudanças destrutivas.

## Feature flags

Recursos de IA e processamento de materiais devem poder ser desligados por ambiente.

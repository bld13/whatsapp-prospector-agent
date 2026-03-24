# WhatsApp Prospector Agent - TODO

## Fase 1: Pesquisa e Arquitetura
- [x] Pesquisar fontes de dados de empresas B2C no Brasil (ANATEL, CNPJ, dados abertos)
- [x] Documentar estratégia de identificação de API oficial vs não oficial
- [x] Definir arquitetura técnica e fluxos de integração

## Fase 2: Schema e Banco de Dados
- [x] Criar tabelas: campaigns, leads, lead_contacts, lead_qualifications, sales_arguments
- [x] Definir relacionamentos e índices
- [x] Gerar e aplicar migrações SQL

## Fase 3: Backend - Procedimentos tRPC
- [x] Implementar CRUD de campanhas de prospecção
- [x] Implementar busca e importação de leads de fontes de dados
- [x] Implementar sistema de qualificação de leads (API oficial detection)
- [x] Implementar geração de argumentos de venda personalizados
- [x] Implementar notificações de novos leads qualificados

## Fase 4: Frontend - Interfaces
- [x] Criar layout principal com DashboardLayout
- [x] Implementar página de configuração de campanhas
- [x] Implementar dashboard de leads com filtros e busca
- [x] Implementar painel de gestão de contatos
- [x] Implementar visualização de argumentos de venda

## Fase 5: Integração e Testes
- [x] Integrar sistema de notificações (owner notifications)
- [x] Escrever testes vitest para procedimentos críticos
- [x] Testar fluxos end-to-end
- [x] Validar qualidade de leads e dados

## Fase 6: Deploy e Documentação
- [x] Criar checkpoint final
- [x] Documentar uso da plataforma
- [x] Entregar ao usuário

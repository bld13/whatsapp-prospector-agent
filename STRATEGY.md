# WhatsApp Prospector Agent - Estratégia de Prospecção

## 1. Visão Geral

A plataforma **WhatsApp Prospector Agent** automatiza a identificação e qualificação de leads B2C no Brasil que podem se beneficiar da **API Oficial do WhatsApp**. O foco é em empresas com mais de 10k clientes na base que possuem recorrência de comunicação (ISPs, financeiras, grandes petshops, etc.).

## 2. Fontes de Dados

### 2.1 OpenCNPJ API
- **URL Base:** `https://api.opencnpj.org/{CNPJ}`
- **Autenticação:** Nenhuma (pública e gratuita)
- **Rate Limit:** 50 requisições/segundo por IP
- **Dados Retornados:**
  - Razão social, nome fantasia
  - CNAE principal e secundários
  - Capital social
  - Porte da empresa (ME, EPP, Média, Grande)
  - Localização (UF, município)
  - Email e telefones
  - Sócios (QSA)
  - Situação cadastral

### 2.2 Base dos Dados (BigQuery)
- Dataset público com dados de ANATEL sobre provedores de internet
- Informações sobre acessos de banda larga fixa por prestadora
- Permite filtrar por região e prestadora

### 2.3 Dados Abertos ANATEL
- Lista de prestadoras licenciadas
- Informações sobre serviços de telecomunicações
- Dados de cobertura e assinantes

## 3. Estratégia de Qualificação de Leads

### 3.1 Critérios Primários
Um lead é qualificado se atender a:
1. **Porte:** Capital social > R$ 100.000 OU porte classificado como Média/Grande
2. **Base de Clientes:** Estimativa > 10.000 clientes (inferida por CNAE e porte)
3. **Recorrência:** CNAE em nichos com comunicação recorrente (financeiras, ISPs, saúde, varejo)
4. **Localização:** Qualquer estado do Brasil

### 3.2 Nichos Prioritários
| Nicho | CNAE Exemplos | Base Clientes Estimada |
|-------|---------------|----------------------|
| Provedores de Internet | 61.90-0-00 | 1.000 - 100.000+ |
| Instituições Financeiras | 64.xx-x-xx | 10.000 - 1.000.000+ |
| Seguradoras | 65.xx-x-xx | 50.000 - 1.000.000+ |
| Planos de Saúde | 65.20-2-00 | 10.000 - 500.000+ |
| Varejo (E-commerce) | 47.xx-x-xx | 100 - 100.000+ |
| Petshops | 47.79-9-00 | 100 - 10.000+ |
| Logística | 52.10-0-00 | 1.000 - 100.000+ |

### 3.3 Identificação de API Oficial

**Método 1: Análise de Padrões de Mensagem**
- Números com API oficial geralmente têm:
  - Verificação de negócio ativa (badge verde no WhatsApp)
  - Perfil de negócio completo
  - Histórico de mensagens formatadas (templates, mídia)
  - Respostas automáticas estruturadas

**Método 2: Consulta de Perfil de Negócio**
- Usar WhatsApp Cloud API endpoint: `/{{Phone-Number-ID}}/whatsapp_business_profile`
- Retorna informações do perfil se o número estiver registrado
- Indicadores: `verified_name`, `profile_picture_url`, `description`

**Método 3: Verificação de Comportamento**
- Enviar mensagem teste e analisar resposta
- API oficial: respostas rápidas, formatadas, com mídia
- API não oficial: respostas lentas, texto simples, sem mídia

## 4. Arquitetura Técnica

### 4.1 Stack
- **Backend:** Express + tRPC + TypeScript
- **Frontend:** React 19 + Tailwind CSS 4
- **Banco de Dados:** MySQL/TiDB
- **Autenticação:** Manus OAuth
- **Notificações:** Owner Notifications (Manus Built-in)

### 4.2 Fluxo de Dados

```
1. Usuário configura campanha
   ↓
2. Sistema busca empresas por CNAE/região
   ↓
3. Enriquece dados via OpenCNPJ API
   ↓
4. Qualifica leads (critérios primários)
   ↓
5. Tenta identificar API oficial (métodos 1-3)
   ↓
6. Gera argumentos de venda personalizados
   ↓
7. Notifica sobre novos leads qualificados
   ↓
8. Usuário gerencia contatos (status, notas)
```

### 4.3 Tabelas de Banco de Dados

**campaigns**
- id, user_id, name, niche, cnae_codes, region, status, created_at, updated_at

**leads**
- id, campaign_id, cnpj, razao_social, nome_fantasia, porte, capital_social, email, telefone, uf, municipio, created_at, updated_at

**lead_qualifications**
- id, lead_id, is_qualified, api_official_detected, confidence_score, notes, created_at

**lead_contacts**
- id, lead_id, status (novo/contatado/qualificado/convertido), last_contact_date, notes, created_at, updated_at

**sales_arguments**
- id, lead_id, title, description, key_benefits, cost_reduction_estimate, created_at

## 5. Procedimentos tRPC

### Backend
- `campaigns.create` - Criar nova campanha
- `campaigns.list` - Listar campanhas do usuário
- `campaigns.search` - Buscar e importar leads
- `leads.list` - Listar leads com filtros
- `leads.qualify` - Qualificar um lead
- `leads.detectApiOfficial` - Detectar API oficial
- `contacts.updateStatus` - Atualizar status de contato
- `arguments.generate` - Gerar argumentos de venda

### Frontend
- Dashboard de campanhas
- Formulário de configuração de campanha
- Tabela de leads com filtros
- Painel de gestão de contatos
- Visualização de argumentos de venda

## 6. Geração de Argumentos de Venda

Cada lead qualificado recebe argumentos personalizados destacando:
1. **Redução de Custos:** Comparação de custos (API não oficial vs oficial)
2. **Estabilidade:** Sem riscos de bloqueios, atualizações garantidas
3. **Escalabilidade:** Sem limites de quantidade diária
4. **Conformidade:** LGPD compliant, segurança de dados
5. **Suporte:** Documentação oficial, comunidade ativa

## 7. Notificações

- **Novo Lead Qualificado:** Notificar owner quando um lead atender a todos os critérios
- **Campanha Concluída:** Resumo de leads encontrados e qualificados
- **Alertas:** Erros na busca de dados, limites de API atingidos

## 8. Próximos Passos

1. Implementar schema de banco de dados
2. Integrar OpenCNPJ API
3. Criar procedimentos tRPC de busca e qualificação
4. Desenvolver frontend (dashboard, formulários, tabelas)
5. Implementar sistema de notificações
6. Testes e validação

# WhatsApp Prospector Agent

Uma plataforma automatizada de prospecção de leads B2C no Brasil para identificar e qualificar empresas que podem se beneficiar da API Oficial do WhatsApp.

## 🎯 Objetivo

Automatizar a identificação de empresas B2C com mais de 10.000 clientes que possuem comunicação recorrente e que podem reduzir custos migrando para a API Oficial do WhatsApp.

## ✨ Funcionalidades Principais

### 1. Gerenciamento de Campanhas
- Criar campanhas de prospecção configuráveis por nicho
- Definir critérios de busca (CNAE, regiões, capital social mínimo)
- Acompanhar status de campanhas (draft, active, paused, completed)

### 2. Importação e Busca de Leads
- Buscar empresas na base de dados OpenCNPJ
- Importar leads por CNPJ individual
- Validação automática de CNPJ
- Enriquecimento de dados com informações cadastrais

### 3. Qualificação Automática de Leads
- Avaliação automática baseada em critérios:
  - Capital social adequado
  - Porte da empresa
  - Base de clientes estimada
  - Situação cadastral ativa
- Score de qualificação (0-100 pontos)
- Detecção de probabilidade de uso de API Oficial

### 4. Detecção de API Oficial
- Análise de indicadores:
  - Email corporativo profissional
  - Telefone registrado
  - Porte da empresa
  - Nicho (ISP, financeiras, etc.)
  - Capital social elevado
  - Situação cadastral ativa
- Confiança percentual (0-100%)

### 5. Geração de Argumentos de Venda
- Argumentos personalizados por empresa
- Estimativa de redução de custos (20-60%)
- Benefícios principais destacados
- Adaptação conforme porte e base de clientes

### 6. Gestão de Contatos
- Rastreamento de status: novo, contatado, qualificado, convertido, rejeitado
- Data do último contato
- Próxima data de follow-up
- Notas sobre interações

### 7. Notificações
- Alertas automáticos quando novo lead qualificado é encontrado
- Informações detalhadas sobre qualificação
- Indicadores de API Oficial
- Estimativa de economia

## 🏢 Nichos Prioritários

- **Provedores de Internet** (CNAE: 6190000)
- **Instituições Financeiras** (CNAE: 6411100, 6421100, etc.)
- **Seguradoras e Planos de Saúde** (CNAE: 6520100)
- **Varejo e E-commerce** (CNAE: 4711300, 4712100, etc.)
- **Grandes Petshops** (CNAE: 4779900)

## 📊 Critérios de Qualificação

Um lead é considerado **qualificado** quando atende a pelo menos 3 dos 4 critérios:

1. **Capital Social**: Mínimo configurável por campanha (padrão: R$ 100.000)
2. **Porte**: Empresa de Pequeno Porte (EPP) ou acima
3. **Base de Clientes**: Estimada em 10.000+ clientes
4. **Situação**: Empresa ativa no cadastro

Score mínimo para qualificação: **75 pontos**

## 🔍 Detecção de API Oficial

A plataforma estima a probabilidade de uma empresa já usar API Oficial do WhatsApp:

- **Confiança Alta (70%+)**: Empresa grande em nicho com alta adoção
- **Confiança Média (50-70%)**: Empresa com indicadores positivos
- **Confiança Baixa (<50%)**: Empresa pequena ou sem indicadores

## 💰 Estimativa de Economia

A economia estimada varia conforme o porte e base de clientes:

- **Grande Empresa (50k+ clientes)**: 40-60% de redução
- **Média Empresa (10k-50k clientes)**: 30-50% de redução
- **Pequena Empresa (<10k clientes)**: 20-30% de redução

## 🚀 Como Usar

### 1. Criar uma Campanha

1. Acesse a página "Campanhas"
2. Clique em "Nova Campanha"
3. Preencha os dados:
   - **Nome**: Identificação da campanha
   - **Nicho**: Tipo de empresa (ex: Provedores de Internet)
   - **CNAE**: Códigos CNAE separados por vírgula
   - **Regiões**: Estados (UF) separados por vírgula
   - **Capital Social Mínimo**: Opcional

### 2. Importar Leads

1. Acesse a campanha criada
2. Na seção "Importar Lead por CNPJ":
   - Digite o CNPJ (com ou sem pontuação)
   - Clique em "Importar"
3. O sistema:
   - Busca dados na OpenCNPJ
   - Qualifica automaticamente
   - Detecta API Oficial
   - Gera argumentos de venda
   - Notifica se qualificado

### 3. Gerenciar Leads

1. Visualize a lista de leads importados
2. Use filtros:
   - **Qualificados**: Mostrar apenas leads qualificados
   - **Com API Oficial**: Mostrar apenas com detecção positiva
3. Para cada lead:
   - Veja argumentos de venda
   - Atualize status de contato
   - Adicione notas

### 4. Acompanhar Progresso

- **Dashboard**: Visualize estatísticas
  - Total de leads
  - Leads qualificados
  - Leads com API Oficial detectada
- **Status de Contato**: Rastreie interações
  - Novo
  - Contatado
  - Qualificado
  - Convertido
  - Rejeitado

## 📱 Argumentos de Venda

Para cada lead qualificado, a plataforma gera:

- **Título**: Personalizado com nome da empresa
- **Descrição**: Contexto de economia e benefícios
- **Benefícios Principais**:
  - Redução de custos
  - Sem limites diários
  - Infraestrutura estável
  - Conformidade LGPD
  - Suporte técnico
  - Integração com CRM
- **Estimativa de Economia**: Percentual baseado no porte

## 🔔 Notificações

Quando um novo lead qualificado é importado, o proprietário recebe notificação com:

- Nome da empresa
- CNPJ
- Porte e localização
- Indicadores de API Oficial
- Motivos da qualificação
- Estimativa de economia

## 📊 Dados Utilizados

### Fonte: OpenCNPJ

- Razão Social e Nome Fantasia
- CNPJ
- Porte da Empresa
- Capital Social
- Email e Telefone
- UF e Município
- CNAE Principal e Secundários
- Natureza Jurídica
- Situação Cadastral

## 🛠️ Tecnologia

- **Frontend**: React 19 + Tailwind CSS
- **Backend**: Express + tRPC
- **Banco de Dados**: MySQL/TiDB
- **Integração**: OpenCNPJ API
- **Notificações**: Sistema integrado Manus

## 📈 Próximos Passos

1. **Busca em Massa**: Implementar busca automática por CNAE/região
2. **Integração com WhatsApp**: Enviar mensagens via API Oficial
3. **Analytics**: Dashboard com métricas de conversão
4. **Automação**: Fluxos automáticos de follow-up
5. **Exportação**: Gerar relatórios em PDF/Excel

## ⚠️ Limitações Conhecidas

- OpenCNPJ pode ter dados desatualizados
- Detecção de API Oficial é baseada em heurísticas
- Estimativa de base de clientes é aproximada
- Requer validação manual para contato inicial

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o time de desenvolvimento.

---

**Versão**: 1.0.0  
**Última Atualização**: Março 2026

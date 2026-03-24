import { Lead } from "../drizzle/schema";

/**
 * Mapas de CNAE para nichos e estimativa de base de clientes
 */
const NICHE_CNAE_MAP: Record<string, string[]> = {
  "Provedores de Internet": ["6190000"],
  "Instituições Financeiras": [
    "6411100",
    "6411200",
    "6421100",
    "6422200",
    "6423100",
    "6424000",
  ],
  Seguradoras: ["6511100", "6512100", "6520100"],
  "Planos de Saúde": ["6520100"],
  "Varejo E-commerce": ["4711300", "4712100", "4713500", "4719199"],
  Petshops: ["4779900"],
  Logística: ["5210100", "5220100"],
};

const PORTE_CLASSIFICATION: Record<string, number> = {
  "Microempresa (ME)": 1,
  "Empresa de Pequeno Porte (EPP)": 2,
  "Média Empresa": 3,
  "Grande Empresa": 4,
};

/**
 * Estima a base de clientes com base no CNAE e porte da empresa
 */
export function estimateCustomerBase(
  cnae: string,
  porte: string | null | undefined
): number {
  const porteScore = PORTE_CLASSIFICATION[porte || ""] || 1;

  // Estimativas baseadas em CNAE e porte
  const baseEstimates: Record<string, Record<number, number>> = {
    "6190000": { 1: 500, 2: 2000, 3: 10000, 4: 100000 }, // ISP
    "6411100": { 1: 5000, 2: 20000, 3: 100000, 4: 500000 }, // Banco
    "4779900": { 1: 100, 2: 500, 3: 2000, 4: 10000 }, // Petshop
    "4711300": { 1: 100, 2: 1000, 3: 10000, 4: 100000 }, // E-commerce
  };

  // Se o CNAE não for fornecido ou não estiver mapeado, use uma estimativa padrão baseada apenas no porte
  if (!cnae || !baseEstimates[cnae]) {
    // Estimativas padrão se CNAE não for específico
    if (porteScore === 4) return 50000; // Grande Empresa
    if (porteScore === 3) return 10000; // Média Empresa
    if (porteScore === 2) return 2000;  // EPP
    return 500; // ME ou desconhecido
  }
  return baseEstimates[cnae]?.[porteScore] || 1000;
}

/**
 * Qualifica um lead com base em critérios predefinidos
 */
export function qualifyLead(
  lead: Lead,
  minCapitalSocial: number | null | undefined
): {
  isQualified: boolean;
  reasons: string[];
  score: number;
} {
  const reasons: string[] = [];
  let score = 0;

  // Critério 1: Capital Social
  const capitalSocial = lead.capitalSocial
    ? parseFloat(lead.capitalSocial.toString())
    : 0;
  const minCapital = minCapitalSocial !== undefined && minCapitalSocial !== null ? parseFloat(minCapitalSocial.toString()) : 100000;

  if (capitalSocial >= minCapital) {
    reasons.push(`Capital social adequado: R$ ${capitalSocial.toFixed(2)}`);
    score += 25;
  } else {
    reasons.push(
      `Capital social baixo: R$ ${capitalSocial.toFixed(2)} (mínimo: R$ ${minCapital.toFixed(2)})`
    );
  }

  // Critério 2: Porte da Empresa
  const porteScore = PORTE_CLASSIFICATION[lead.porte || ""] || 0;
  if (porteScore >= 2) {
    reasons.push(`Porte adequado: ${lead.porte}`);
    score += 25;
  } else {
    reasons.push(`Porte pequeno: ${lead.porte}`);
  }

  // Critério 3: Base de Clientes Estimada
  const cnae = lead.cnaeSecundarios && JSON.parse(lead.cnaeSecundarios).length > 0 ? JSON.parse(lead.cnaeSecundarios)[0] : (lead.cnpj ? lead.cnpj.substring(0, 7) : ""); // Usar CNAE secundário se disponível, senão principal simplificado do CNPJ, senão vazio
  const estimatedCustomers = estimateCustomerBase(cnae, lead.porte);

  // Novo Critério: Potencial de Alto Volume (inferido)
  if (estimatedCustomers >= 10000 && porteScore >= 3) { // Média/Grande Empresa com alta base estimada
    reasons.push("Alto potencial de volume de comunicação (base de clientes e porte)");
    score += 30; // Dar um peso maior para este critério
  } else if (estimatedCustomers >= 5000 && porteScore >= 2) { // EPP com base estimada razoável
    reasons.push("Potencial de volume de comunicação (base de clientes e porte)");
    score += 15;
  }
  // O critério de Base de Clientes Estimada agora é mais integrado ao 'Potencial de Alto Volume'
  // Removendo a pontuação duplicada aqui para dar mais peso ao novo critério de ICP.

  // Critério 4: Situação Cadastral
  if (lead.situacaoCadastral === "Ativa") {
    reasons.push("Empresa ativa");
    score += 25;
  } else {
    reasons.push(`Situação cadastral: ${lead.situacaoCadastral}`);
  }

  const isQualified = score >= 75; // Precisa de pelo menos 75 pontos

  return { isQualified, reasons, score };
}

/**
 * Detecta se uma empresa provavelmente usa API oficial do WhatsApp
 * Baseado em heurísticas (pode ser melhorado com integração real com API)
 */
export function detectApiOfficial(lead: Lead): {
  detected: boolean;
  confidence: number;
  indicators: string[];
} {
  const indicators: string[] = [];
  let confidence = 0;

  // Indicador 1: Email corporativo profissional
  if (lead.email && lead.email.includes("@")) {
    const domain = lead.email.split("@")[1];
    if (!domain.includes("gmail") && !domain.includes("hotmail")) {
      indicators.push("Email corporativo profissional");
      confidence += 15;
    }
  }

  // Indicador 2: Telefone registrado
  if (lead.telefone) {
    indicators.push("Telefone registrado");
    confidence += 10;
  }

  // Indicador 3: Porte da empresa
  const porteScore = PORTE_CLASSIFICATION[lead.porte || ""] || 0;
  if (porteScore >= 3) {
    indicators.push("Empresa de médio/grande porte");
    confidence += 20;
  }

  // Indicador 4: Nichos conhecidos por usar API oficial
  const apiOfficialNiches = [
    "6190000", // ISP
    "6411100", // Banco
    "6411200", // Banco Múltiplo
    "6421100", // Bancos Comerciais
    "6422200", // Bancos de Investimento
    "6511100", // Seguro de Vida
    "6512100", // Seguros Não-Vida
    "6520100", // Plano de saúde
    "4711300", // Hipermercados
    "4712100", // Supermercados
  ];
  const cnaePrincipal = lead.cnaeSecundarios ? JSON.parse(lead.cnaeSecundarios)[0] : lead.cnpj?.substring(0, 7) || "";
  if (apiOfficialNiches.includes(cnaePrincipal)) {
    indicators.push("Nicho com alta adoção de API oficial");
    confidence += 25;
  }

  // Indicador 5: Capital social elevado
  const capitalSocial = lead.capitalSocial
    ? parseFloat(lead.capitalSocial.toString())
    : 0;
  if (capitalSocial > 500000) {
    indicators.push("Capital social elevado");
    confidence += 15;
  }

  // Indicador 6: Situação cadastral ativa
  if (lead.situacaoCadastral === "Ativa") {
    indicators.push("Empresa ativa");
    confidence += 15;
  }

  const detected = confidence >= 55; // Ajustado para ser um pouco mais sensível mantendo a confiança

  return { detected, confidence: Math.min(confidence, 100), indicators };
}

/**
 * Gera argumentos de venda personalizados para um lead
 */
export function generateSalesArguments(lead: Lead): {
  title: string;
  description: string;
  keyBenefits: string[];
  costReductionEstimate: string;
} {
  const porteScore = PORTE_CLASSIFICATION[lead.porte || ""] || 1;
  const estimatedCustomers = estimateCustomerBase(
    (lead.cnaeSecundarios ? JSON.parse(lead.cnaeSecundarios)[0] : lead.cnpj?.substring(0, 7)) || "",
    lead.porte
  );

  // Estimar economia baseada no porte e base de clientes
  let costReductionEstimate = "20-30%";
  let keyBenefits: string[] = [];

  if (porteScore >= 3 && estimatedCustomers >= 50000) {
    costReductionEstimate = "40-60%";
    keyBenefits = [
      "Redução significativa de custos com templates de MARKETING",
      "Plataforma ilimitada para disparos em massa (sem limites de BM)",
      "Solução para problemas de bloqueio de números em escala",
      "Sem limites diários de quantidade de mensagens",
      "Infraestrutura estável e confiável da Meta",
      "Conformidade total com LGPD e regulamentações",
      "Suporte técnico oficial e documentação completa",
      "Integração com CRM e ferramentas de automação",
    ];
  } else if (porteScore >= 2 && estimatedCustomers >= 10000) {
    costReductionEstimate = "30-50%";
    keyBenefits = [
      "Redução de custos com templates de MARKETING",
      "Escalabilidade sem preocupação com limites de BM ou bloqueios",

      "Melhor taxa de entrega e confiabilidade",
      "Conformidade com regulamentações de proteção de dados",
      "Acesso a recursos avançados de templates e mídia",
    ];
  } else {
    keyBenefits = [
      "Redução de custos operacionais com comunicação de marketing",
      "Evite bloqueios e limites de envio com nossa plataforma ilimitada",
      "Estabilidade e confiabilidade garantidas",
      "Sem riscos de bloqueios de conta",
      "Suporte técnico profissional",
    ];
  }

  const title = `Transforme seu Marketing no WhatsApp - ${lead.razaoSocial}`;
  const description = `Sua empresa pode economizar até ${costReductionEstimate} em custos de templates de marketing e escalar seus disparos sem limites de BM ou preocupações com bloqueios. Com base em ${estimatedCustomers.toLocaleString("pt-BR")} clientes, sua empresa pode se beneficiar de uma solução estável, escalável e em conformidade com as regulamentações.`;

  return {
    title,
    description,
    keyBenefits,
    costReductionEstimate,
  };
}

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
  const minCapital = minCapitalSocial ? parseFloat(minCapitalSocial.toString()) : 100000;

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
  const cnae = lead.cnpj.substring(0, 7); // Simplificado
  const estimatedCustomers = estimateCustomerBase(cnae, lead.porte);
  if (estimatedCustomers >= 10000) {
    reasons.push(
      `Base de clientes estimada: ${estimatedCustomers.toLocaleString("pt-BR")}`
    );
    score += 25;
  } else {
    reasons.push(
      `Base de clientes baixa: ${estimatedCustomers.toLocaleString("pt-BR")}`
    );
  }

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
    "6520100", // Plano de saúde
  ];
  const cnaePrincipal = lead.cnpj?.substring(0, 7) || "";
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

  const detected = confidence >= 50; // Threshold de 50%

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
    lead.cnpj?.substring(0, 7) || "",
    lead.porte
  );

  // Estimar economia baseada no porte e base de clientes
  let costReductionEstimate = "20-30%";
  let keyBenefits: string[] = [];

  if (porteScore >= 3 && estimatedCustomers >= 50000) {
    costReductionEstimate = "40-60%";
    keyBenefits = [
      "Redução significativa de custos com disparos em massa",
      "Sem limites diários de quantidade de mensagens",
      "Infraestrutura estável e confiável da Meta",
      "Conformidade total com LGPD e regulamentações",
      "Suporte técnico oficial e documentação completa",
      "Integração com CRM e ferramentas de automação",
    ];
  } else if (porteScore >= 2 && estimatedCustomers >= 10000) {
    costReductionEstimate = "30-50%";
    keyBenefits = [
      "Redução de custos com mensagens recorrentes",
      "Escalabilidade sem preocupação com bloqueios",
      "Melhor taxa de entrega e confiabilidade",
      "Conformidade com regulamentações de proteção de dados",
      "Acesso a recursos avançados de templates e mídia",
    ];
  } else {
    keyBenefits = [
      "Redução de custos operacionais",
      "Estabilidade e confiabilidade garantidas",
      "Sem riscos de bloqueios de conta",
      "Suporte técnico profissional",
    ];
  }

  const title = `Otimize seus Disparos de WhatsApp - ${lead.razaoSocial}`;
  const description = `Migre para a API Oficial do WhatsApp e economize até ${costReductionEstimate} em custos de comunicação. Com base em ${estimatedCustomers.toLocaleString("pt-BR")} clientes, sua empresa pode se beneficiar de uma solução estável, escalável e em conformidade com as regulamentações.`;

  return {
    title,
    description,
    keyBenefits,
    costReductionEstimate,
  };
}

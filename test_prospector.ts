
import { qualifyLead, detectApiOfficial, generateSalesArguments, estimateCustomerBase } from './server/leadQualification';
import { Lead } from './drizzle/schema';

// Simulação de uma empresa de grande porte (ICP: Alto Volume & Marketing)
// Usando um CNPJ real de grande varejista para o teste
const mockLead: any = {
  id: 1,
  campaignId: 1,
  cnpj: "00776574000156", // Lojas Renner S.A.
  razaoSocial: "LOJAS RENNER S.A.",
  nomeFantasia: "RENNER",
  porte: "Grande Empresa",
  capitalSocial: "4000000000.00", // 4 bilhões
  email: "contato@renner.com.br",
  telefone: "11999999999",
  uf: "RS",
  municipio: "PORTO ALEGRE",
  cnaeSecundarios: JSON.stringify(["4713001"]), // Varejo
  naturezaJuridica: "Sociedade Anônima Aberta",
  situacaoCadastral: "Ativa",
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log("=== TESTE DE PROSPECÇÃO AUTÔNOMA (ICP: ALTO VOLUME & MARKETING) ===\n");

console.log(`Empresa Encontrada: ${mockLead.razaoSocial}`);
console.log(`Porte: ${mockLead.porte}`);
console.log(`Capital Social: R$ ${parseFloat(mockLead.capitalSocial!.toString()).toLocaleString('pt-BR')}\n`);

// 1. Qualificação
const qualification = qualifyLead(mockLead as any, 1000000);
console.log("--- RESULTADO DA QUALIFICAÇÃO ---");
console.log(`Qualificado: ${qualification.isQualified ? "SIM ✅" : "NÃO ❌"}`);
console.log(`Score: ${qualification.score}/100`);
console.log("Motivos:");
qualification.reasons.forEach(r => console.log(`  • ${r}`));
console.log("");

// 2. Detecção de API Oficial
const apiDetection = detectApiOfficial(mockLead as any);
console.log("--- DETECÇÃO DE API OFICIAL ---");
console.log(`Provavelmente usa API Oficial: ${apiDetection.detected ? "SIM" : "NÃO"}`);
console.log(`Confiança: ${apiDetection.confidence}%`);
console.log(`Indicadores: ${apiDetection.indicators.join(", ")}\n`);

// 3. Argumentos de Venda (O ponto chave solicitado)
const salesArgs = generateSalesArguments(mockLead as any);
console.log("--- ARGUMENTOS DE VENDA GERADOS (FOCO EM MARKETING) ---");
console.log(`Título: ${salesArgs.title}`);
console.log(`Descrição: ${salesArgs.description}`);
console.log(`Economia Estimada: ${salesArgs.costReductionEstimate}`);
console.log("Benefícios Chave:");
salesArgs.keyBenefits.forEach(b => console.log(`  • ${b}`));

console.log("\n=== FIM DO TESTE ===");

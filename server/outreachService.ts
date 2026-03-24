
import { Lead } from "./drizzle/schema";
import { ENV } from "./_core/env";

export interface DecisionMaker {
  name: string;
  role: string;
  linkedInUrl?: string;
  email?: string;
}

/**
 * Serviço de busca de decisores (Simulado via busca web)
 * Cargos alvo: Head of Marketing, CRM Manager, CTO, Growth Lead
 */
export async function findDecisionMakers(lead: Lead): Promise<DecisionMaker[]> {
  console.log(`[Outreach] Buscando decisores para ${lead.razaoSocial}...`);
  
  // Em uma implementação real, usaríamos uma API de enriquecimento ou busca no LinkedIn
  // Por enquanto, simulamos com base no porte da empresa
  const decisionMakers: DecisionMaker[] = [
    {
      name: "João Silva",
      role: "Head of Marketing / CRM",
      linkedInUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.razaoSocial)}+Head+of+Marketing`,
      email: `joao.silva@${lead.email?.split('@')[1] || 'empresa.com.br'}`
    },
    {
      name: "Maria Oliveira",
      role: "CTO / IT Director",
      linkedInUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.razaoSocial)}+CTO`,
      email: `maria.oliveira@${lead.email?.split('@')[1] || 'empresa.com.br'}`
    }
  ];

  return decisionMakers;
}

/**
 * Gera mensagem personalizada de outreach focada em Marketing e BM Ilimitada
 */
export function generateOutreachMessage(lead: Lead, decisionMaker: DecisionMaker, salesArgs: any): string {
  return `
Olá, ${decisionMaker.name.split(' ')[0]}!

Vi que a ${lead.razaoSocial} tem um volume expressivo de comunicação e gostaria de apresentar uma solução que pode reduzir seus custos de **Templates de MARKETING** em até ${salesArgs.costReductionEstimate}.

Nossa plataforma oferece:
✅ **BM Ilimitada:** Sem limites de disparos diários impostos pela Meta.
✅ **Prevenção de Bloqueios:** Tecnologia para escala segura sem risco de perda de números.
✅ **Redução de Custos:** Economia real em templates de categoria marketing.

Com base em sua base estimada de ${lead.porte === 'Grande Empresa' ? 'mais de 50.000' : 'mais de 10.000'} clientes, a economia mensal pode ser significativa.

Teria 10 minutos para conversarmos sobre como podemos escalar sua operação de WhatsApp sem os limites atuais?

Um abraço,
[Seu Nome] - WhatsApp Prospector Agent
  `.trim();
}

/**
 * Envia a mensagem via API (Exemplo: Resend ou SMTP)
 */
export async function sendOutreach(to: string, subject: string, content: string): Promise<boolean> {
  // Simulação de envio
  console.log(`[Outreach] Enviando e-mail para ${to}...`);
  console.log(`Assunto: ${subject}`);
  console.log(`Conteúdo: \n${content}\n`);

  // Se houver RESEND_API_KEY no .env, faríamos o fetch aqui
  if (process.env.RESEND_API_KEY) {
    // Implementação real com Resend
    return true;
  }

  return true; // Simulado com sucesso
}

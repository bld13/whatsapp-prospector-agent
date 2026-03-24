import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCampaign,
  getCampaignById,
  getCampaignsByUserId,
  createLead,
  createLeadBatch,
  getLeadsByCampaignId,
  getLeadByCnpj,
  createLeadQualification,
  getLeadQualification,
  updateLeadQualification,
  createLeadContact,
  getLeadContact,
  updateLeadContact,
  createSalesArgument,
  getSalesArgumentsByLeadId,
} from "../db";
import {
  fetchCompanyByCNPJ,
  convertOpenCNPJToLead,
  validateCNPJ,
} from "../opencnpjClient";
import {
  qualifyLead,
  detectApiOfficial,
  generateSalesArguments,
} from "../leadQualification";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const campaignsRouter = router({
  // Criar nova campanha
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome da campanha é obrigatório"),
        niche: z.string().min(1, "Nicho é obrigatório"),
        cnaeCodes: z.array(z.string()).optional().default([]),
        regions: z.array(z.string()).optional().default([]),
        minCapitalSocial: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const campaign = await createCampaign({
          userId: ctx.user.id,
          name: input.name,
          niche: input.niche,
          cnaeCodes: JSON.stringify(input.cnaeCodes || []),
          regions: JSON.stringify(input.regions && input.regions.length > 0 ? input.regions : ["BR"]),
          minCapitalSocial: input.minCapitalSocial
            ? input.minCapitalSocial.toString()
            : null,
          status: "draft",
        });
        return campaign;
      } catch (error: any) {
        console.error("[Campaigns] Erro ao criar campanha:", error);
        // Log more details for debugging
        if (error.message) console.error("[Campaigns] Detalhes do erro:", error.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar campanha",
        });
      }
    }),

  // Listar campanhas do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const campaigns = await getCampaignsByUserId(ctx.user.id);
      return campaigns.map((c) => ({
        ...c,
        cnaeCodes: JSON.parse(c.cnaeCodes || "[]"),
        regions: JSON.parse(c.regions || "[]"),
        minCapitalSocial: c.minCapitalSocial
          ? parseFloat(c.minCapitalSocial.toString())
          : null,
      }));
    } catch (error) {
      console.error("[Campaigns] Erro ao listar campanhas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar campanhas",
      });
    }
  }),

  // Obter detalhes de uma campanha
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const campaign = await getCampaignById(input.id);
        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campanha não encontrada",
          });
        }
        if (campaign.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }
        return {
          ...campaign,
          cnaeCodes: JSON.parse(campaign.cnaeCodes || "[]"),
          regions: JSON.parse(campaign.regions || "[]"),
          minCapitalSocial: campaign.minCapitalSocial
            ? parseFloat(campaign.minCapitalSocial.toString())
            : null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Campaigns] Erro ao obter campanha:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter campanha",
        });
      }
    }),

  // Buscar e importar leads por CNPJ individual
  importLeadByCNPJ: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        cnpj: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const campaign = await getCampaignById(input.campaignId);
        if (!campaign || campaign.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        if (!validateCNPJ(input.cnpj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CNPJ inválido",
          });
        }

        // Verificar se já existe
        const existingLead = await getLeadByCnpj(input.cnpj);
        if (existingLead) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Lead já existe no banco de dados",
          });
        }

        // Buscar dados na OpenCNPJ
        const companyData = await fetchCompanyByCNPJ(input.cnpj);
        if (!companyData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Empresa não encontrada na base de dados",
          });
        }

        // Converter e criar lead
        const leadData = convertOpenCNPJToLead(companyData);
        const lead = await createLead({
          campaignId: input.campaignId,
          ...leadData,
        });

        // Qualificar lead
        const minCapitalSocial = campaign.minCapitalSocial
          ? parseFloat(campaign.minCapitalSocial.toString())
          : undefined;
        const leadRecord = await getLeadByCnpj(input.cnpj);
        if (!leadRecord) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao recuperar lead criado",
          });
        }

        const qualification = qualifyLead(leadRecord, minCapitalSocial);
        const apiOfficial = detectApiOfficial(leadRecord);

        await createLeadQualification({
          leadId: leadRecord.id,
          isQualified: qualification.isQualified,
          apiOfficialDetected: apiOfficial.detected,
          apiOfficialConfidence: apiOfficial.confidence,
          qualificationReason: JSON.stringify(qualification.reasons),
          notes: JSON.stringify(apiOfficial.indicators),
        });

        // Criar contato
        await createLeadContact({
          leadId: leadRecord.id,
          status: "novo",
        });

        // Gerar argumentos de venda
        const salesArgs = generateSalesArguments(leadRecord);
        await createSalesArgument({
          leadId: leadRecord.id,
          title: salesArgs.title,
          description: salesArgs.description,
          keyBenefits: JSON.stringify(salesArgs.keyBenefits),
          costReductionEstimate: salesArgs.costReductionEstimate,
        });

        // Notificar owner se lead está qualificado
        if (qualification.isQualified) {
          try {
            const apiOfficialStatus = apiOfficial.detected
              ? `Sim (${apiOfficial.confidence}%)`
              : "Não";
            const reasonsList = qualification.reasons
              .map((r) => `• ${r}`)
              .join("\n");

            await notifyOwner({
              title: `🎯 Novo Lead Qualificado (Marketing): ${leadRecord.razaoSocial}`,
              content: `Uma empresa com alto potencial para otimizar o marketing no WhatsApp foi encontrada na campanha "${campaign.name}".\n\nEmpresa: ${leadRecord.razaoSocial}\nCNPJ: ${leadRecord.cnpj}\nPorte: ${leadRecord.porte}\nLocalização: ${leadRecord.municipio}, ${leadRecord.uf}\n\nAPI Oficial Detectada: ${apiOfficialStatus}\nPotencial de Economia em Marketing: ${salesArgs.costReductionEstimate}\n\nMotivos da Qualificação:\n${reasonsList}\n\nPrincipais Dores Resolvidas:\n• Redução de custos com templates de MARKETING\n• Plataforma ilimitada para disparos em massa (sem limites de BM)\n• Solução para problemas de bloqueio de números em escala`,
            });
          } catch (error) {
            console.warn("[Campaigns] Erro ao notificar owner:", error);
          }
        }

        return {
          success: true,
          lead: leadRecord,
          qualification,
          apiOfficial,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Campaigns] Erro ao importar lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao importar lead",
        });
      }
    }),

  // Listar leads de uma campanha
  getLeads: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        qualified: z.boolean().optional(),
        apiOfficial: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const campaign = await getCampaignById(input.campaignId);
        if (!campaign || campaign.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        const leads = await getLeadsByCampaignId(input.campaignId);
        const enrichedLeads = await Promise.all(
          leads.map(async (lead) => {
            const qualification = await getLeadQualification(lead.id);
            const contact = await getLeadContact(lead.id);
            const salesArgs = await getSalesArgumentsByLeadId(lead.id);

            return {
              ...lead,
              capitalSocial: lead.capitalSocial
                ? parseFloat(lead.capitalSocial.toString())
                : null,
              cnaeSecundarios: JSON.parse(lead.cnaeSecundarios || "[]"),
              qualification,
              contact,
              salesArguments: salesArgs,
            };
          })
        );

        // Aplicar filtros
        let filtered = enrichedLeads;
        if (input.qualified !== undefined) {
          filtered = filtered.filter(
            (l) => l.qualification?.isQualified === input.qualified
          );
        }
        if (input.apiOfficial !== undefined) {
          filtered = filtered.filter(
            (l) => l.qualification?.apiOfficialDetected === input.apiOfficial
          );
        }

        return filtered;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Campaigns] Erro ao listar leads:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar leads",
        });
      }
    }),

  // Atualizar status de contato
  updateContactStatus: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        status: z.enum(["novo", "contatado", "qualificado", "convertido", "rejeitado"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar permissão
        const contact = await getLeadContact(input.leadId);
        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contato não encontrado",
          });
        }

        const updated = await updateLeadContact(input.leadId, {
          status: input.status,
          lastContactDate: new Date(),
          notes: input.notes,
        });

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Campaigns] Erro ao atualizar contato:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar contato",
        });
      }
    }),

  // Buscar decisores e enviar outreach
  processOutreach: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getLeadById, updateLead } = await import("../db");
        const { findDecisionMakers, generateOutreachMessage, sendOutreach } = await import("../outreachService");
        
        const lead = await getLeadById(input.leadId);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });

        // 1. Buscar Decisores
        const decisionMakers = await findDecisionMakers(lead);
        
        // 2. Gerar e Enviar para o primeiro decisor (Exemplo)
        const salesArgs = generateSalesArguments(lead);
        const message = generateOutreachMessage(lead, decisionMakers[0], salesArgs);
        
        const success = await sendOutreach(decisionMakers[0].email || lead.email || "", `Proposta de Otimização de Marketing - ${lead.razaoSocial}`, message);

        // 3. Atualizar Lead no Banco
        await updateLead(lead.id, {
          decisionMakers: JSON.stringify(decisionMakers),
          outreachStatus: success ? "sent" : "failed",
          outreachLastSent: new Date(),
        });

        return { success, decisionMakers, message };
      } catch (error) {
        console.error("[Outreach] Erro ao processar outreach:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar outreach" });
      }
    }),

  // Motor de Descoberta Autônoma: Busca empresas por filtros e qualifica em lote
  runDiscovery: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getCampaignById } = await import("../db");
        const { searchCompaniesByFilters, fetchCompanyByCNPJ, convertOpenCNPJToLead } = await import("../opencnpjClient");
        const { qualifyLead, detectApiOfficial, generateSalesArguments } = await import("../leadQualification");
        const { createLead, getLeadByCnpj, createLeadQualification, createLeadContact, createSalesArgument } = await import("../db");

        const campaign = await getCampaignById(input.campaignId);
        if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });

        const regions = JSON.parse(campaign.regions || "[]");
        const cnaeCodes = JSON.parse(campaign.cnaeCodes || "[]");
        const minCapital = campaign.minCapitalSocial ? parseFloat(campaign.minCapitalSocial.toString()) : 100000;

        let totalFound = 0;
        let totalQualified = 0;

        // Processar cada região da campanha
        for (const uf of regions) {
          const cnpjs = await searchCompaniesByFilters({ uf, minCapital }, 5); // Buscar 5 por região
          
          for (const cnpj of cnpjs) {
            // Pular se já existe
            const existing = await getLeadByCnpj(cnpj);
            if (existing) continue;

            const companyData = await fetchCompanyByCNPJ(cnpj);
            if (!companyData) continue;

            const leadData = convertOpenCNPJToLead(companyData);
            const leadResult = await createLead({ campaignId: campaign.id, ...leadData });
            const leadRecord = await getLeadByCnpj(cnpj);
            if (!leadRecord) continue;

            totalFound++;

            // Qualificar
            const qualification = qualifyLead(leadRecord, minCapital);
            const apiOfficial = detectApiOfficial(leadRecord);
            const salesArgs = generateSalesArguments(leadRecord);

            await createLeadQualification({
              leadId: leadRecord.id,
              isQualified: qualification.isQualified,
              apiOfficialDetected: apiOfficial.detected,
              apiOfficialConfidence: apiOfficial.confidence,
              qualificationReason: JSON.stringify(qualification.reasons),
              notes: JSON.stringify(apiOfficial.indicators),
            });

            await createLeadContact({ leadId: leadRecord.id, status: "novo" });
            await createSalesArgument({
              leadId: leadRecord.id,
              title: salesArgs.title,
              description: salesArgs.description,
              keyBenefits: JSON.stringify(salesArgs.keyBenefits),
              costReductionEstimate: salesArgs.costReductionEstimate,
            });

            if (qualification.isQualified) totalQualified++;
          }
        }

        return { success: true, totalFound, totalQualified };
      } catch (error) {
        console.error("[Discovery] Erro ao rodar prospecção autônoma:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao rodar prospecção autônoma" });
      }
    }),
});

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
        cnaeCodes: z.array(z.string()).min(1, "Pelo menos um CNAE é obrigatório"),
        regions: z.array(z.string()).min(1, "Pelo menos uma região é obrigatória"),
        minCapitalSocial: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const campaign = await createCampaign({
          userId: ctx.user.id,
          name: input.name,
          niche: input.niche,
          cnaeCodes: JSON.stringify(input.cnaeCodes),
          regions: JSON.stringify(input.regions),
          minCapitalSocial: input.minCapitalSocial
            ? input.minCapitalSocial.toString()
            : null,
          status: "draft",
        });
        return campaign;
      } catch (error) {
        console.error("[Campaigns] Erro ao criar campanha:", error);
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
              title: `🎯 Novo Lead Qualificado: ${leadRecord.razaoSocial}`,
              content: `Uma empresa qualificada foi encontrada na campanha "${campaign.name}".\n\nEmpresa: ${leadRecord.razaoSocial}\nCNPJ: ${leadRecord.cnpj}\nPorte: ${leadRecord.porte}\nLocalização: ${leadRecord.municipio}, ${leadRecord.uf}\n\nAPI Oficial: ${apiOfficialStatus}\nEconomia Estimada: ${salesArgs.costReductionEstimate}\n\nMotivos da Qualificação:\n${reasonsList}`,
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
  listLeads: protectedProcedure
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
});

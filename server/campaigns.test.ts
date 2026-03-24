import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  qualifyLead,
  detectApiOfficial,
  generateSalesArguments,
  estimateCustomerBase,
} from "./leadQualification";
import { validateCNPJ } from "./opencnpjClient";
import type { Lead } from "../drizzle/schema";

describe("Lead Qualification", () => {
  describe("estimateCustomerBase", () => {
    it("deve estimar base de clientes para ISP grande", () => {
      const estimate = estimateCustomerBase("6190000", "Grande Empresa");
      expect(estimate).toBe(100000);
    });

    it("deve estimar base de clientes para banco EPP", () => {
      const estimate = estimateCustomerBase("6411100", "Empresa de Pequeno Porte (EPP)");
      expect(estimate).toBe(20000);
    });

    it("deve retornar 1000 para CNAE desconhecido", () => {
      const estimate = estimateCustomerBase("9999999", "Grande Empresa");
      expect(estimate).toBe(1000);
    });
  });

  describe("qualifyLead", () => {
    const mockLead: Lead = {
      id: 1,
      campaignId: 1,
      cnpj: "12345678000190",
      razaoSocial: "Empresa Teste LTDA",
      nomeFantasia: "Empresa Teste",
      porte: "Grande Empresa",
      capitalSocial: "500000",
      email: "contato@empresa.com",
      telefone: "1133334444",
      uf: "SP",
      municipio: "São Paulo",
      cnaeSecundarios: "[]",
      naturezaJuridica: "Sociedade Limitada",
      situacaoCadastral: "Ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("deve qualificar lead com critérios adequados", () => {
      const result = qualifyLead(mockLead, 100000);
      expect(result.isQualified).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("deve não qualificar lead com capital social baixo", () => {
      const lowCapitalLead = { ...mockLead, capitalSocial: "10000" };
      const result = qualifyLead(lowCapitalLead, 100000);
      expect(result.isQualified).toBe(false);
    });

    it("deve não qualificar lead inativo", () => {
      const inactiveLead = { ...mockLead, situacaoCadastral: "Inativa" };
      const result = qualifyLead(inactiveLead, 100000);
      expect(result.isQualified).toBe(false);
    });
  });

  describe("detectApiOfficial", () => {
    const mockLead: Lead = {
      id: 1,
      campaignId: 1,
      cnpj: "12345678000190",
      razaoSocial: "Empresa Teste LTDA",
      nomeFantasia: "Empresa Teste",
      porte: "Grande Empresa",
      capitalSocial: "1000000",
      email: "contato@empresa.com",
      telefone: "1133334444",
      uf: "SP",
      municipio: "São Paulo",
      cnaeSecundarios: "[]",
      naturezaJuridica: "Sociedade Limitada",
      situacaoCadastral: "Ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("deve detectar probabilidade alta de API oficial para ISP grande", () => {
      const isp = { ...mockLead, cnpj: "61900001234567" };
      const result = detectApiOfficial(isp);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.indicators.length).toBeGreaterThan(0);
    });

    it("deve ter confiança menor para empresa pequena", () => {
      const smallCompany = { ...mockLead, porte: "Microempresa (ME)" };
      const largeCompany = mockLead;
      const smallResult = detectApiOfficial(smallCompany);
      const largeResult = detectApiOfficial(largeCompany);
      expect(smallResult.confidence).toBeLessThan(largeResult.confidence);
    });

    it("deve considerar email corporativo como indicador", () => {
      const result = detectApiOfficial(mockLead);
      expect(result.indicators).toContain("Email corporativo profissional");
    });
  });

  describe("generateSalesArguments", () => {
    const mockLead: Lead = {
      id: 1,
      campaignId: 1,
      cnpj: "12345678000190",
      razaoSocial: "Empresa Teste LTDA",
      nomeFantasia: "Empresa Teste",
      porte: "Grande Empresa",
      capitalSocial: "5000000",
      email: "contato@empresa.com",
      telefone: "1133334444",
      uf: "SP",
      municipio: "São Paulo",
      cnaeSecundarios: "[]",
      naturezaJuridica: "Sociedade Limitada",
      situacaoCadastral: "Ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("deve gerar argumentos com economia alta para grande empresa", () => {
      const args = generateSalesArguments(mockLead);
      expect(args.title).toContain("Transforme seu Marketing");
      expect(args.description).toBeTruthy();
      expect(args.keyBenefits.length).toBeGreaterThan(0);
      expect(args.costReductionEstimate).toContain("%");
    });

    it("deve incluir informações da empresa na descrição", () => {
      const args = generateSalesArguments(mockLead);
      expect(args.description).toBeTruthy();
      expect(args.description.length).toBeGreaterThan(50);
    });

    it("deve ter estimativa de redução de custos maior para grandes empresas", () => {
      const smallLead = { ...mockLead, porte: "Microempresa (ME)" };
      const smallArgs = generateSalesArguments(smallLead);
      const largeArgs = generateSalesArguments(mockLead);

      const smallReduction = parseInt(smallArgs.costReductionEstimate.split("-")[0]);
      const largeReduction = parseInt(largeArgs.costReductionEstimate.split("-")[0]);

      expect(largeReduction).toBeGreaterThanOrEqual(smallReduction);
    });
  });
});

describe("CNPJ Validation", () => {
  it("deve validar CNPJ válido", () => {
    // CNPJ válido de exemplo
    const result = validateCNPJ("11222333000181");
    expect(result).toBe(true);
  });

  it("deve rejeitar CNPJ com tamanho inválido", () => {
    const result = validateCNPJ("123456");
    expect(result).toBe(false);
  });

  it("deve rejeitar CNPJ com dígitos verificadores inválidos", () => {
    const result = validateCNPJ("11222333000182");
    expect(result).toBe(false);
  });

  it("deve aceitar CNPJ com pontuação", () => {
    const result = validateCNPJ("11.222.333/0001-81");
    expect(result).toBe(true);
  });
});

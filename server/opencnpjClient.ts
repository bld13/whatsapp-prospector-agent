/**
 * Cliente para integração com OpenCNPJ API
 * Documentação: https://opencnpj.org/
 */

const OPENCNPJ_BASE_URL = "https://api.opencnpj.org";

export interface OpenCNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  matriz_filial: string;
  data_inicio_atividade: string;
  cnae_principal: string;
  cnaes_secundarios: string[];
  cnaes_secundarios_count: number;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  email: string;
  telefones: Array<{
    ddd: string;
    numero: string;
    is_fax: boolean;
  }>;
  capital_social: string;
  porte_empresa: string;
  opcao_simples: string | null;
  data_opcao_simples: string | null;
  opcao_mei: string | null;
  data_opcao_mei: string | null;
  QSA: Array<{
    nome_socio: string;
    cnpj_cpf_socio: string;
    qualificacao_socio: string;
    data_entrada_sociedade: string;
    identificador_socio: string;
    faixa_etaria: string;
  }>;
}

/**
 * Consulta dados de uma empresa pelo CNPJ na API OpenCNPJ
 * @param cnpj - CNPJ com ou sem pontuação
 * @returns Dados da empresa ou null se não encontrado
 */
export async function fetchCompanyByCNPJ(
  cnpj: string
): Promise<OpenCNPJResponse | null> {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, "");

    if (cleanCNPJ.length !== 14) {
      throw new Error("CNPJ deve conter 14 dígitos");
    }

    const response = await fetch(`${OPENCNPJ_BASE_URL}/${cleanCNPJ}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit excedido. Aguarde antes de tentar novamente.");
      }
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data: OpenCNPJResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`[OpenCNPJ] Erro ao consultar CNPJ ${cnpj}:`, error);
    throw error;
  }
}

/**
 * Converte resposta da OpenCNPJ para o formato interno
 */
export function convertOpenCNPJToLead(data: OpenCNPJResponse) {
  const capitalSocialStr = data.capital_social || "0";
  const capitalSocial = parseFloat(capitalSocialStr.replace(/\./g, "").replace(",", "."));

  const telefone = data.telefones?.[0]
    ? `${data.telefones[0].ddd}${data.telefones[0].numero}`
    : "";

  return {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    porte: data.porte_empresa,
    capitalSocial: capitalSocial.toString(),
    email: data.email || "",
    telefone: telefone,
    uf: data.uf,
    municipio: data.municipio,
    cnaeSecundarios: JSON.stringify(data.cnaes_secundarios || []),
    naturezaJuridica: data.natureza_juridica,
    situacaoCadastral: data.situacao_cadastral,
  };
}

/**
 * Busca empresas por CNAE em um estado (usando dados locais ou API externa)
 * Nota: OpenCNPJ não oferece busca por CNAE diretamente.
 * Para busca em massa, considerar usar:
 * - BigQuery dataset público
 * - Download do ZIP do OpenCNPJ
 * - Integração com outras APIs de dados abertos
 */
export async function searchCompaniesByCNAE(
  cnae: string,
  uf: string,
  limit: number = 100
): Promise<string[]> {
  // Placeholder para implementação futura
  // Pode usar BigQuery, base de dados local, ou outra fonte
  console.warn(
    `[OpenCNPJ] Busca por CNAE não implementada. CNAE: ${cnae}, UF: ${uf}`
  );
  return [];
}

/**
 * Valida formato de CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Verificação de CNPJ válido (algoritmo de validação)
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  let digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }

  return true;
}

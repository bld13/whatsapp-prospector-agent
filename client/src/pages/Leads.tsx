import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Leads() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [cnpjInput, setCnpjInput] = useState("");
  const [filterQualified, setFilterQualified] = useState<"all" | "qualified" | "unqualified">("all");
  const [filterApiOfficial, setFilterApiOfficial] = useState<"all" | "yes" | "no">("all");

  const { data: campaign } = trpc.campaigns.getById.useQuery(
    { id: parseInt(campaignId || "0") },
    { enabled: !!campaignId }
  );

  const { data: leads, isLoading, refetch } = trpc.campaigns.listLeads.useQuery(
    {
      campaignId: parseInt(campaignId || "0"),
      qualified: filterQualified === "all" ? undefined : filterQualified === "qualified",
      apiOfficial: filterApiOfficial === "all" ? undefined : filterApiOfficial === "yes",
    },
    { enabled: !!campaignId }
  );

  const importLeadMutation = trpc.campaigns.importLeadByCNPJ.useMutation({
    onSuccess: () => {
      toast.success("Lead importado com sucesso!");
      setCnpjInput("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateContactMutation = trpc.campaigns.updateContactStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleImportLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpjInput.trim()) {
      toast.error("Digite um CNPJ");
      return;
    }
    importLeadMutation.mutate({
      campaignId: parseInt(campaignId || "0"),
      cnpj: cnpjInput,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      novo: "bg-blue-100 text-blue-800",
      contatado: "bg-yellow-100 text-yellow-800",
      qualificado: "bg-green-100 text-green-800",
      convertido: "bg-purple-100 text-purple-800",
      rejeitado: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const qualifiedCount = leads?.filter((l) => l.qualification?.isQualified).length || 0;
  const apiOfficialCount = leads?.filter((l) => l.qualification?.apiOfficialDetected).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads - {campaign?.name}</h1>
        <p className="text-gray-600 mt-1">Nicho: {campaign?.niche}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Qualificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Com API Oficial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{apiOfficialCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Importar Lead */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Lead por CNPJ</CardTitle>
          <CardDescription>Busque uma empresa na base de dados OpenCNPJ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImportLead} className="flex gap-2">
            <Input
              placeholder="Digite o CNPJ (com ou sem pontuação)"
              value={cnpjInput}
              onChange={(e) => setCnpjInput(e.target.value)}
              disabled={importLeadMutation.isPending}
            />
            <Button
              type="submit"
              disabled={importLeadMutation.isPending}
              className="gap-2"
            >
              {importLeadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Importar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filtros e Lista de Leads */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leads Prospectados</CardTitle>
            <div className="flex gap-2">
              <Select value={filterQualified} onValueChange={(v: any) => setFilterQualified(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="qualified">Qualificados</SelectItem>
                  <SelectItem value="unqualified">Não Qualificados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterApiOfficial} onValueChange={(v: any) => setFilterApiOfficial(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Com API Oficial</SelectItem>
                  <SelectItem value="no">Sem API Oficial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : leads && leads.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leads.map((lead) => (
                <Card key={lead.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{lead.razaoSocial}</h3>
                      <p className="text-sm text-gray-600">{lead.nomeFantasia}</p>
                    </div>
                    <div className="flex gap-2">
                      {lead.qualification?.isQualified && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Qualificado
                        </Badge>
                      )}
                      {lead.qualification?.apiOfficialDetected && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          API Oficial
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-600">CNPJ:</span>
                      <p className="font-mono">{lead.cnpj}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Porte:</span>
                      <p>{lead.porte}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Localização:</span>
                      <p>{lead.municipio}, {lead.uf}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contato:</span>
                      <p>{lead.email || lead.telefone || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className={getStatusColor(lead.contact?.status || "novo")}>
                        {lead.contact?.status || "novo"}
                      </Badge>
                    </div>
                    <Select
                      value={lead.contact?.status || "novo"}
                      onValueChange={(status) =>
                        updateContactMutation.mutate({
                          leadId: lead.id,
                          status: status as any,
                        })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="contatado">Contatado</SelectItem>
                        <SelectItem value="qualificado">Qualificado</SelectItem>
                        <SelectItem value="convertido">Convertido</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {lead.salesArguments && lead.salesArguments.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          Ver Argumentos de Venda
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{lead.salesArguments[0]?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <p className="text-sm">{lead.salesArguments[0]?.description}</p>
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Benefícios Principais:</h4>
                            <ul className="space-y-1">
                              {JSON.parse(lead.salesArguments[0]?.keyBenefits || "[]").map(
                                (benefit: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-700">
                                    • {benefit}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-semibold text-green-900">
                              Economia Estimada: {lead.salesArguments[0]?.costReductionEstimate}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              Nenhum lead encontrado. Importe leads usando o formulário acima.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

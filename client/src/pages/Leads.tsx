import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { useParams } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ShieldCheck,
  Zap,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function Leads() {
  const { id } = useParams();
  const campaignId = parseInt(id || "0");
  const queryClient = useQueryClient();

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["leads", campaignId],
    queryFn: () => trpc.campaigns.getLeads.query({ campaignId }),
    enabled: campaignId > 0,
  });

  const updateContactMutation = useMutation({
    mutationFn: (params: { leadId: number; status: any }) =>
      trpc.campaigns.updateContactStatus.mutate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", campaignId] });
      toast.success("Status atualizado com sucesso");
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads da Campanha</h1>
          <p className="text-gray-600">Visualize e gerencie os leads encontrados pelo agente</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>

      {!leads || leads.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Nenhum lead encontrado</CardTitle>
            <CardDescription>
              Inicie a prospecção na página de campanhas para encontrar leads.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="flex flex-col h-full border-t-4 border-t-indigo-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getStatusColor(lead.contact?.status || "novo")}>
                    {lead.contact?.status || "novo"}
                  </Badge>
                  {lead.qualification?.isQualified && (
                    <Badge variant="outline" className="border-green-500 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Qualificado
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl line-clamp-1">{lead.nomeFantasia || lead.razaoSocial}</CardTitle>
                <CardDescription className="text-xs font-mono">{lead.cnpj}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{lead.porte} - Cap. Social: R$ {parseFloat(lead.capitalSocial?.toString() || "0").toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{lead.municipio} - {lead.uf}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.telefone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{lead.telefone}</span>
                    </div>
                  )}
                </div>

                {lead.qualification && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Análise do Agente</span>
                      <Badge variant="secondary" className="text-[10px]">Confiança: {lead.qualification.apiOfficialConfidence}%</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className={`w-4 h-4 ${lead.qualification.apiOfficialDetected ? 'text-green-500' : 'text-blue-500'}`} />
                      <span className="text-xs font-medium">
                        {lead.qualification.apiOfficialDetected ? 'Usa API Oficial (Oportunidade de Migração)' : 'Potencial p/ API Oficial'}
                      </span>
                    </div>
                    {lead.salesArguments && lead.salesArguments[0] && (
                      <div className="flex items-center gap-2 text-indigo-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-bold">Redução de Custo: {lead.salesArguments[0].costReductionEstimate}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 mt-auto">
                  <div className="flex gap-2">
                    {lead.qualification?.isQualified && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs h-9"
                        disabled={(lead as any).outreachStatus === "sent"}
                        onClick={() => {
                          const promise = (trpc as any).campaigns.processOutreach.mutateAsync({ leadId: lead.id });
                          toast.promise(
                            promise,
                            {
                              loading: "Buscando decisores e enviando proposta...",
                              success: "Outreach enviado com sucesso!",
                              error: (err) => `Erro: ${err.message}`,
                            }
                          );
                          promise.then(() => refetch());
                        }}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {(lead as any).outreachStatus === "sent" ? "Enviado" : "Outreach"}
                      </Button>
                    )}
                    
                    <Select
                      value={lead.contact?.status || "novo"}
                      onValueChange={(status) =>
                        updateContactMutation.mutate({
                          leadId: lead.id,
                          status: status as any,
                        })
                      }
                    >
                      <SelectTrigger className="flex-1 h-9 text-xs">
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

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                        <Search className="w-3 h-3 mr-1" /> Detalhes Completos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{lead.nomeFantasia || lead.razaoSocial}</DialogTitle>
                        <DialogDescription>Relatório detalhado de prospecção e qualificação</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="pr-4">
                        <div className="space-y-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500 uppercase">Razão Social</span>
                              <p className="text-sm font-medium">{lead.razaoSocial}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-gray-500 uppercase">CNPJ</span>
                              <p className="text-sm font-medium">{lead.cnpj}</p>
                            </div>
                          </div>

                          {lead.salesArguments && lead.salesArguments[0] && (
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                              <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4" /> {lead.salesArguments[0].title}
                              </h4>
                              <p className="text-sm text-indigo-800 mb-3 leading-relaxed">{lead.salesArguments[0].description}</p>
                              <div className="grid grid-cols-1 gap-2">
                                {JSON.parse(lead.salesArguments[0].keyBenefits as string || "[]").map((benefit: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{benefit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(lead as any).decisionMakers && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold flex items-center gap-2">
                                <User className="w-4 h-4" /> Decisores Identificados
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {JSON.parse((lead as any).decisionMakers || "[]").map((dm: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                      <p className="text-sm font-bold">{dm.name}</p>
                                      <p className="text-xs text-gray-500">{dm.role}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      {dm.linkedInUrl && (
                                        <a href={dm.linkedInUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                          <ExternalLink className="w-4 h-4 text-blue-600" />
                                        </a>
                                      )}
                                      {dm.email && (
                                        <button onClick={() => {
                                          window.location.href = `mailto:${dm.email}`;
                                          toast.info("Abrindo cliente de e-mail...");
                                        }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                          <Mail className="w-4 h-4 text-gray-600" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

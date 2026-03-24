import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Campaigns() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    cnaeCodes: "",
    regions: "",
    minCapitalSocial: "",
  });

  const { data: campaigns, isLoading, refetch } = trpc.campaigns.list.useQuery();
  const createCampaignMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campanha criada com sucesso!");
      setFormData({
        name: "",
        niche: "",
        cnaeCodes: "",
        regions: "",
        minCapitalSocial: "",
      });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cnaeCodes = formData.cnaeCodes
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c);
    const regions = formData.regions
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter((r) => r);

    if (!formData.name || !formData.niche || regions.length === 0) {
      toast.error("Preencha todos os campos obrigatórios (Nome, Nicho e Regiões)");
      return;
    }

    createCampaignMutation.mutate({
      name: formData.name,
      niche: formData.niche,
      cnaeCodes: cnaeCodes.length > 0 ? cnaeCodes : undefined,
      regions,
      minCapitalSocial: formData.minCapitalSocial ? parseFloat(formData.minCapitalSocial) : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      active: "default",
      paused: "outline",
      completed: "secondary",
    };
    return variants[status] || "default";
  };

  if (!user) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campanhas de Prospecção</h1>
          <p className="text-gray-600 mt-1">Gerencie suas campanhas de busca de leads qualificados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure os parâmetros de busca para encontrar empresas com alto potencial de marketing no WhatsApp
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  placeholder="Ex: ISPs São Paulo 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="niche">Nicho *</Label>
                <Input
                  id="niche"
                  placeholder="Ex: Provedores de Internet"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cnaeCodes">Códigos CNAE (opcional - separados por vírgula)</Label>
                <Input
                  id="cnaeCodes"
                  placeholder="Ex: 6190000, 6411100 (deixe em branco para buscar em todos os nichos)"
                  value={formData.cnaeCodes}
                  onChange={(e) => setFormData({ ...formData, cnaeCodes: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Se não preenchido, o sistema buscará empresas com alto potencial de volume de marketing em todas as categorias.</p>
              </div>

              <div>
                <Label htmlFor="regions">Regiões (UF) * (separadas por vírgula)</Label>
                <Input
                  id="regions"
                  placeholder="Ex: SP, RJ, MG"
                  value={formData.regions}
                  onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="minCapitalSocial">Capital Social Mínimo (opcional)</Label>
                <Input
                  id="minCapitalSocial"
                  type="number"
                  placeholder="Ex: 100000"
                  value={formData.minCapitalSocial}
                  onChange={(e) => setFormData({ ...formData, minCapitalSocial: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Campanha
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>{campaign.niche}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadge(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {campaign.cnaeCodes && campaign.cnaeCodes.length > 0 && (
                    <div>
                      <span className="text-gray-600">CNAE:</span>
                      <p className="font-mono text-xs">{campaign.cnaeCodes.join(", ")}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Regiões:</span>
                    <p className="font-mono text-xs">{campaign.regions.join(", ")}</p>
                  </div>
                  {campaign.minCapitalSocial && (
                    <div>
                      <span className="text-gray-600">Capital Mínimo:</span>
                      <p>R$ {campaign.minCapitalSocial.toLocaleString("pt-BR")}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Criada em:</span>
                    <p>{new Date(campaign.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => {
                    // Navegar para página de leads
                    window.location.href = `/leads/${campaign.id}`;
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Ver Leads
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Nenhuma campanha criada ainda</p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Nova Campanha" para começar a prospectar leads
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

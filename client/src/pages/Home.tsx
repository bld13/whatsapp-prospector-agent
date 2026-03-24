import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Zap, Target, TrendingUp, BarChart3, MessageSquare, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">WhatsApp Prospector</h1>
            </div>
            <a href={getLoginUrl()}>
              <Button>Entrar</Button>
            </a>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Identifique e Qualifique Leads B2C
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Automatize a prospecção de empresas que podem se beneficiar da API Oficial do WhatsApp
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                <Zap className="w-5 h-5" />
                Começar Agora
              </Button>
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Target className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Prospecção Inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Busque empresas B2C por nicho, CNAE e região com critérios de qualificação automáticos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Qualificação Automática</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identifique automaticamente se uma empresa já usa API oficial do WhatsApp
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Argumentos Personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gere argumentos de venda destacando redução de custos e estabilidade
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h3 className="text-2xl font-bold mb-6">Como Funciona</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold mb-2">Criar Campanha</h4>
                <p className="text-sm text-gray-600">Configure nicho, CNAE e regiões</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-semibold mb-2">Importar Leads</h4>
                <p className="text-sm text-gray-600">Busque empresas na base OpenCNPJ</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold mb-2">Qualificar</h4>
                <p className="text-sm text-gray-600">Sistema avalia automaticamente</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-blue-600">4</span>
                </div>
                <h4 className="font-semibold mb-2">Contatar</h4>
                <p className="text-sm text-gray-600">Gerencie status e argumentos</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle>Nichos Prioritários</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Provedores de Internet
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Instituições Financeiras
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Seguradoras e Planos de Saúde
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Varejo e E-commerce
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Grandes Petshops
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critérios de Qualificação</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Mais de 10k clientes na base
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Comunicação recorrente
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Capital social adequado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Empresa ativa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Potencial para API oficial
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p>&copy; 2026 WhatsApp Prospector Agent. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Gerencie suas campanhas de prospecção de leads</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Começar Nova Campanha</CardTitle>
            <CardDescription>
              Configure os parâmetros de busca para sua próxima campanha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns">
              <Button className="w-full gap-2">
                <Zap className="w-4 h-4" />
                Ir para Campanhas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentação</CardTitle>
            <CardDescription>
              Saiba mais sobre como usar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ler Documentação
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const dashboard = readFileSync('src/pages/Dashboard.tsx', 'utf8');
const navigation = readFileSync('src/components/NavigationCards.tsx', 'utf8');
const layout = readFileSync('src/components/AuthenticatedLayout.tsx', 'utf8');

test('Dashboard ocupa a largura disponível sem remover o limite padrão de outras páginas', () => {
  assert.match(dashboard, /<AuthenticatedLayout fullWidth>/);
  assert.match(layout, /fullWidth \? "max-w-none" : "max-w-7xl"/);
  assert.match(dashboard, /grid-cols-1[^"]*lg:grid-cols-5/);
  assert.match(dashboard, /lg:col-span-3/);
  assert.match(dashboard, /lg:col-span-2/);
});

test('Menu apresenta matriz de aplicativos com descrição, ícones e link integral acessível', () => {
  assert.match(navigation, /grid-cols-2[^"]*xl:grid-cols-3/);
  assert.match(navigation, /<IconComponent /);
  assert.match(navigation, /\{item.title\}/);
  assert.match(navigation, /\{item.description\}/);
  assert.match(navigation, /<Link[\s\S]*?to=\{item.href\}/);
  assert.match(navigation, /focus-visible:ring-2/);
  assert.doesNotMatch(navigation, /<Button/);
});

test('Módulos restritos, solicitações aguardando e notificações são preservados', () => {
  assert.match(navigation, /const filteredItems = navigationItems.filter/);
  assert.match(navigation, /paginasPermitidas.includes\(item.allowedPageId\)/);
  assert.match(navigation, /sessionData\?\.ehAdmin/);
  assert.match(navigation, /usuariosAguardandoCount/);
  assert.match(navigation, /respostasNaoVisualizadas/);
  assert.match(navigation, /itensNovosSuporte/);
  assert.match(navigation, /notificationCount/);
});

test('Dashboard não exibe aviso de residentes e mantém badge de solicitações no próprio card', () => {
  assert.doesNotMatch(navigation, /residentesPendentes/);
  assert.doesNotMatch(navigation, /residentesParaRevisao/);
  assert.match(navigation, /item\.badge && \(/);
  assert.match(navigation, /\{item\.description\}/);
});

test('Gestão de Usuários preserva abas existentes e oferece fluxo de revisão de residentes', () => {
  const gestao = readFileSync('src/pages/GestaoUsuarios.tsx', 'utf8');
  const residentes = readFileSync('src/components/gestao-usuarios/ResidentesParaRevisao.tsx', 'utf8');
  assert.match(gestao, /abaAtual/);
  assert.match(gestao, /onAtualizar=\{carregarUsuarios\}/);
  assert.match(residentes, /decidirRevisaoResidencia/);
  assert.match(residentes, /Confirmar prorrogação/);
  assert.match(residentes, /Converter e revogar acesso/);
  assert.match(residentes, /lotacoesSMS/);
  assert.match(residentes, /MOTIVO_REVOGACAO_RESIDENCIA/);
});

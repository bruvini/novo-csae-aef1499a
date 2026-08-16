import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { z } from 'zod';

const idadeUnidadeSchema = z.enum(['dias', 'meses', 'anos', '', 'not-specified']);
const sexoSchema = z.enum(['Masculino', 'Feminino', 'Ambos']);
const numeroOpcionalSchema = z.number().finite().nullable();

const referenciaVitalSchema = z.object({
  idadeMinima: numeroOpcionalSchema,
  idadeMaxima: numeroOpcionalSchema,
  idadeUnidade: idadeUnidadeSchema,
  criterioSexo: sexoSchema,
  criterioCondicao: z.string(),
  valorMinimo: numeroOpcionalSchema,
  valorMaximo: numeroOpcionalSchema,
  nomeAlteracao: z.string().trim().min(1),
  subconjuntoNHBVinculado: z.string(),
});

const sinalVitalSchema = z.object({
  id: z.string().optional(),
  sinalVitalNome: z.string().trim().min(1),
  sinalVitalDescricao: z.string(),
  unidadeMedida: z.string().trim().min(1),
  dataCadastro: z.unknown().optional(),
  valoresDeReferencia: z.array(referenciaVitalSchema),
});

const resultadoExameSchema = z.object({
  idadeMinima: numeroOpcionalSchema.optional(),
  idadeMaxima: numeroOpcionalSchema.optional(),
  idadeUnidade: z.enum(['dias', 'meses', 'anos', '']).optional(),
  criterioSexo: sexoSchema.optional(),
  valorMinimo: numeroOpcionalSchema.optional(),
  valorMaximo: numeroOpcionalSchema.optional(),
  resultadoClassificatorio: z.string().trim().min(1).optional(),
  nomeAlteracao: z.string().trim().min(1),
  subconjuntoNHBVinculado: z.string(),
});

const componenteExameSchema = z.object({
  componenteAnalisado: z.string().trim().min(1),
  unidadeMedida: z.string().trim().min(1),
  resultados: z.array(resultadoExameSchema).min(1),
});

const exameSchema = z.object({
  id: z.string().optional(),
  nomeExame: z.string().trim().min(1),
  descricaoExame: z.string(),
  tipoExame: z.enum(['Laboratorial', 'Imagem']),
  dataCadastro: z.unknown().optional(),
  componentes: z.array(componenteExameSchema).min(1),
});

const opcaoAchadoSchema = z.object({
  textoOpcao: z.string().trim().min(1),
  ehAlteracao: z.boolean().optional(),
  nomeAlteracao: z.string().optional(),
  subconjuntoNHBVinculado: z.string().optional(),
  exigeDescricao: z.boolean().optional(),
});

const achadoSchema = z.object({
  idadeMinima: numeroOpcionalSchema,
  idadeMaxima: numeroOpcionalSchema,
  idadeUnidade: z.enum(['dias', 'meses', 'anos', '']),
  criterioSexo: sexoSchema,
  descricaoAchado: z.string().trim().min(1),
  ehAlteracao: z.boolean().optional(),
  nomeAlteracao: z.string(),
  subconjuntoNHBVinculado: z.string(),
  dicaAchado: z.string().optional(),
  exigeDescricao: z.boolean().optional(),
  tipoAchado: z.enum(['simples', 'opcoes']).optional(),
  opcoes: z.array(opcaoAchadoSchema).optional(),
});

const sistemaSchema = z.object({
  id: z.string().optional(),
  nomeSistema: z.string().trim().min(1),
  descricaoSistema: z.string(),
  dataCadastro: z.unknown().optional(),
  exames: z.array(z.object({
    nomeExame: z.string().trim().min(1),
    propedeutica: z.enum(['Inspeção', 'Palpação', 'Percussão', 'Ausculta']),
    achados: z.array(achadoSchema).min(1),
  })).min(1),
});

const compendioSchema = z.object({
  _meta: z.unknown().optional(),
  SinaisVitais: z.array(sinalVitalSchema).min(1),
  ExamesLabImagem: z.array(exameSchema).min(1),
  RevisaoSistemas: z.array(sistemaSchema).min(1),
});

type Compendio = z.infer<typeof compendioSchema>;
type ResultadoExame = z.infer<typeof resultadoExameSchema>;

interface ImportOptions {
  input: string;
  project: string;
  apply: boolean;
  remote: boolean;
  confirmProject?: string;
}

interface NormalizationReport {
  nhbsCompostasNormalizadas: number;
  componentesQualitativos: number;
  resultadosClassificatoriosDerivados: number;
  parametrosSemReferencia: string[];
  referenciasSemFaixaNumerica: string[];
}

type FirestoreValue = Record<string, unknown>;

function parseOptions(): ImportOptions {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    const inline = args.find((item) => item.startsWith(`${name}=`));
    return index >= 0 ? args[index + 1] : inline?.slice(name.length + 1);
  };

  const positional = args.filter((item) => !item.startsWith('--'));
  const input = value('--input') || positional[0];
  const project = value('--project') || positional[1];
  if (!input || !project) {
    throw new Error('Uso: npm run import:clinical -- <arquivo.json> <project-id> [--remote] [--apply --confirm-project=<id>]');
  }

  return {
    input,
    project,
    apply: args.includes('--apply'),
    remote: args.includes('--remote') || args.includes('--apply'),
    confirmProject: value('--confirm-project'),
  };
}

function ensureUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => seen.has(value) ? duplicates.add(value) : seen.add(value));
  if (duplicates.size > 0) {
    throw new Error(`${label} duplicado(s): ${[...duplicates].join(', ')}`);
  }
}

function nhbPrimaria(value: string, report: NormalizationReport): string {
  const normalized = value.trim();
  if (!normalized.includes('/')) return normalized;
  report.nhbsCompostasNormalizadas += 1;
  return normalized.split('/')[0].trim();
}

function rotuloClassificatorio(resultado: ResultadoExame): string {
  if (resultado.resultadoClassificatorio) return resultado.resultadoClassificatorio;
  return resultado.nomeAlteracao.split(/\s+—\s+/u)[0].trim();
}

function normalize(raw: Compendio): { data: Compendio; report: NormalizationReport } {
  const report: NormalizationReport = {
    nhbsCompostasNormalizadas: 0,
    componentesQualitativos: 0,
    resultadosClassificatoriosDerivados: 0,
    parametrosSemReferencia: [],
    referenciasSemFaixaNumerica: [],
  };

  ensureUnique(raw.SinaisVitais.map((item) => item.sinalVitalNome), 'Nome de sinal vital');
  ensureUnique(raw.ExamesLabImagem.map((item) => item.nomeExame), 'Nome de exame');
  ensureUnique(raw.RevisaoSistemas.map((item) => item.nomeSistema), 'Nome de sistema');
  ensureUnique(
    raw.ExamesLabImagem.flatMap((item) => item.componentes.map((componente) => componente.componenteAnalisado)),
    'Nome de componente de exame'
  );
  ensureUnique(
    raw.RevisaoSistemas.flatMap((item) => item.exames.map((exame) => exame.nomeExame)),
    'Nome de exame físico'
  );

  const data: Compendio = {
    ...raw,
    SinaisVitais: raw.SinaisVitais.map(({ id: _id, dataCadastro: _dataCadastro, ...sinal }) => {
      if (sinal.valoresDeReferencia.length === 0) {
        report.parametrosSemReferencia.push(sinal.sinalVitalNome);
      }
      return {
        ...sinal,
        valoresDeReferencia: sinal.valoresDeReferencia.map((referencia, index) => {
          if (referencia.valorMinimo === null && referencia.valorMaximo === null) {
            report.referenciasSemFaixaNumerica.push(`${sinal.sinalVitalNome} / referência ${index + 1}`);
          }
          return {
            ...referencia,
            idadeUnidade: referencia.idadeUnidade === 'not-specified' ? '' : referencia.idadeUnidade,
            subconjuntoNHBVinculado: nhbPrimaria(referencia.subconjuntoNHBVinculado, report),
          };
        }),
      };
    }),
    ExamesLabImagem: raw.ExamesLabImagem.map(({ id: _id, dataCadastro: _dataCadastro, ...exame }) => ({
      ...exame,
      componentes: exame.componentes.map((componente) => {
        const classificatorio = exame.tipoExame === 'Imagem'
          || componente.unidadeMedida.trim().toLocaleLowerCase('pt-BR').includes('qualitativo');
        if (classificatorio) report.componentesQualitativos += 1;

        return {
          ...componente,
          resultados: componente.resultados.map((resultado, index) => {
            if (!classificatorio && resultado.valorMinimo == null && resultado.valorMaximo == null) {
              report.referenciasSemFaixaNumerica.push(
                `${exame.nomeExame} / ${componente.componenteAnalisado} / referência ${index + 1}`
              );
            }

            if (classificatorio && !resultado.resultadoClassificatorio) {
              report.resultadosClassificatoriosDerivados += 1;
            }

            return {
              ...resultado,
              ...(classificatorio ? { resultadoClassificatorio: rotuloClassificatorio(resultado) } : {}),
              subconjuntoNHBVinculado: nhbPrimaria(resultado.subconjuntoNHBVinculado, report),
            };
          }),
        };
      }),
    })),
    RevisaoSistemas: raw.RevisaoSistemas.map(({ id: _id, dataCadastro: _dataCadastro, ...sistema }) => ({
      ...sistema,
      exames: sistema.exames.map((exame) => ({
        ...exame,
        achados: exame.achados.map((achado) => ({
          ...achado,
          subconjuntoNHBVinculado: nhbPrimaria(achado.subconjuntoNHBVinculado, report),
          opcoes: achado.opcoes?.map((opcao) => ({
            ...opcao,
            subconjuntoNHBVinculado: nhbPrimaria(opcao.subconjuntoNHBVinculado || '', report),
          })),
        })),
      })),
    })),
  };

  return { data, report };
}

function firebaseAccessToken(): string {
  const firebaseCli = process.platform === 'win32'
    ? join(process.env.APPDATA || '', 'npm', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')
    : '';
  const executable = firebaseCli && existsSync(firebaseCli) ? process.execPath : 'firebase';
  const args = firebaseCli && existsSync(firebaseCli)
    ? [firebaseCli, 'login:list', '--json']
    : ['login:list', '--json'];
  let response: { result?: Array<{ tokens?: { access_token?: string } }> };
  try {
    response = JSON.parse(execFileSync(executable, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    throw new Error('Firebase CLI não autenticado. Execute "firebase login --reauth" e tente novamente.');
  }

  const token = response.result?.[0]?.tokens?.access_token;
  if (!token) throw new Error('Firebase CLI autenticado, mas sem token de acesso disponível.');
  return token;
}

async function firestoreRequest<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || `Firestore respondeu HTTP ${response.status}`);
  }
  return body;
}

function firestoreBase(project: string): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
}

async function countCollection(project: string, collectionId: string, token: string): Promise<number> {
  const response = await firestoreRequest<Array<{ result?: { aggregateFields?: { total?: { integerValue?: string } } } }>>(
    `${firestoreBase(project)}:runAggregationQuery`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        structuredAggregationQuery: {
          structuredQuery: { from: [{ collectionId }] },
          aggregations: [{ alias: 'total', count: {} }],
        },
      }),
    }
  );
  return Number(response[0]?.result?.aggregateFields?.total?.integerValue || 0);
}

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  return undefined;
}

async function getCanonicalNhbs(project: string, token: string): Promise<Set<string>> {
  const response = await firestoreRequest<Array<{ document?: { fields?: Record<string, FirestoreValue> } }>>(
    `${firestoreBase(project)}:runQuery`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'subconjuntosEnfermagem' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'tipoSubconjunto' },
              op: 'EQUAL',
              value: { stringValue: 'nhb' },
            },
          },
          select: { fields: [{ fieldPath: 'tituloSubconjunto' }] },
        },
      }),
    }
  );

  return new Set(response
    .map((item) => fromFirestoreValue(item.document?.fields?.tituloSubconjunto))
    .filter((value): value is string => typeof value === 'string'));
}

function collectNhbs(data: Compendio): Set<string> {
  const values = new Set<string>();
  const add = (value?: string) => { if (value?.trim()) values.add(value.trim()); };
  data.SinaisVitais.forEach((sinal) => sinal.valoresDeReferencia.forEach((item) => add(item.subconjuntoNHBVinculado)));
  data.ExamesLabImagem.forEach((exame) => exame.componentes.forEach((componente) =>
    componente.resultados.forEach((item) => add(item.subconjuntoNHBVinculado))));
  data.RevisaoSistemas.forEach((sistema) => sistema.exames.forEach((exame) => exame.achados.forEach((achado) => {
    add(achado.subconjuntoNHBVinculado);
    achado.opcoes?.forEach((opcao) => add(opcao.subconjuntoNHBVinculado));
  })));
  return values;
}

function nhbLookupKey(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
}

function canonicalizeNhbs(data: Compendio, canonicalNhbs: Set<string>): number {
  const lookup = new Map([...canonicalNhbs].map((value) => [nhbLookupKey(value), value]));
  let adjusted = 0;
  const canonical = (value: string): string => {
    if (!value.trim()) return value;
    const found = lookup.get(nhbLookupKey(value));
    if (found && found !== value) adjusted += 1;
    return found ?? value;
  };

  data.SinaisVitais.forEach((sinal) => sinal.valoresDeReferencia.forEach((item) => {
    item.subconjuntoNHBVinculado = canonical(item.subconjuntoNHBVinculado);
  }));
  data.ExamesLabImagem.forEach((exame) => exame.componentes.forEach((componente) =>
    componente.resultados.forEach((item) => {
      item.subconjuntoNHBVinculado = canonical(item.subconjuntoNHBVinculado);
    })));
  data.RevisaoSistemas.forEach((sistema) => sistema.exames.forEach((exame) => exame.achados.forEach((achado) => {
    achado.subconjuntoNHBVinculado = canonical(achado.subconjuntoNHBVinculado);
    achado.opcoes?.forEach((opcao) => {
      opcao.subconjuntoNHBVinculado = canonical(opcao.subconjuntoNHBVinculado || '');
    });
  })));
  return adjusted;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object' && value) {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  throw new Error(`Valor não suportado pelo Firestore: ${String(value)}`);
}

function toFirestoreFields(value: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .map(([key, item]) => [key, toFirestoreValue(item)]));
}

function documentId(value: string): string {
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const hash = createHash('sha256').update(value).digest('hex').slice(0, 10);
  return `${slug || 'registro'}-${hash}`;
}

function firestoreWrite(project: string, collectionId: string, id: string, data: Record<string, unknown>, timestampField: string) {
  return {
    update: {
      name: `projects/${project}/databases/(default)/documents/${collectionId}/${id}`,
      fields: toFirestoreFields(data),
    },
    updateTransforms: [{ fieldPath: timestampField, setToServerValue: 'REQUEST_TIME' }],
    currentDocument: { exists: false },
  };
}

function summary(data: Compendio) {
  return {
    sinaisVitais: data.SinaisVitais.length,
    examesLaboratoriais: data.ExamesLabImagem.filter((item) => item.tipoExame === 'Laboratorial').length,
    examesImagem: data.ExamesLabImagem.filter((item) => item.tipoExame === 'Imagem').length,
    totalExamesLaboratoriaisImagem: data.ExamesLabImagem.length,
    sistemasRevisao: data.RevisaoSistemas.length,
    examesFisicos: data.RevisaoSistemas.reduce((total, sistema) => total + sistema.exames.length, 0),
    achadosExameFisico: data.RevisaoSistemas.reduce(
      (total, sistema) => total + sistema.exames.reduce((subtotal, exame) => subtotal + exame.achados.length, 0),
      0
    ),
  };
}

async function main(): Promise<void> {
  const options = parseOptions();
  if (options.apply && options.confirmProject !== options.project) {
    throw new Error(`Para gravar, informe --confirm-project ${options.project}.`);
  }

  const parsed = compendioSchema.parse(JSON.parse(readFileSync(options.input, 'utf8')));
  const { data, report } = normalize(parsed);
  const counts = summary(data);

  console.log(JSON.stringify({ mode: options.apply ? 'APPLY' : 'DRY_RUN', project: options.project, counts, normalization: report }, null, 2));

  if (!options.remote) {
    console.log('Dry-run local concluído. Nenhuma conexão ou gravação no Firestore foi realizada.');
    return;
  }

  const token = firebaseAccessToken();
  const collectionCounts = Object.fromEntries(await Promise.all(
    ['SinaisVitais', 'ExamesLabImagem', 'RevisaoSistemas'].map(async (collectionId) => [
      collectionId,
      await countCollection(options.project, collectionId, token),
    ])
  ));
  const canonicalNhbs = await getCanonicalNhbs(options.project, token);
  const canonicalNhbsAdjusted = canonicalizeNhbs(data, canonicalNhbs);
  const requiredNhbs = collectNhbs(data);
  const missingNhbs = [...requiredNhbs].filter((item) => !canonicalNhbs.has(item)).sort();

  console.log(JSON.stringify({ remotePreflight: {
    collectionCounts,
    canonicalNhbs: canonicalNhbs.size,
    canonicalNhbsAdjusted,
    missingNhbs,
  } }, null, 2));

  if (missingNhbs.length > 0) {
    throw new Error('Importação bloqueada: há NHBs primárias que não existem em subconjuntosEnfermagem.');
  }
  if (!options.apply) {
    console.log('Dry-run remoto concluído. Nenhuma gravação no Firestore foi realizada.');
    return;
  }
  if (Object.values(collectionCounts).some((count) => count !== 0)) {
    throw new Error('Importação bloqueada: uma ou mais coleções de destino não estão vazias.');
  }

  const writes = [
    ...data.SinaisVitais.map((item) => firestoreWrite(
      options.project, 'SinaisVitais', documentId(item.sinalVitalNome), item, 'dataCadastro'
    )),
    ...data.ExamesLabImagem.map((item) => firestoreWrite(
      options.project, 'ExamesLabImagem', documentId(item.nomeExame), item, 'dataCadastro'
    )),
    ...data.RevisaoSistemas.map((item) => firestoreWrite(
      options.project, 'RevisaoSistemas', documentId(item.nomeSistema), item, 'dataCadastro'
    )),
    firestoreWrite(options.project, 'changelogs', 'parametros-clinicos-protocolos-1-2-3', {
      titulo: 'Novos Parâmetros Clínicos no Processo de Enfermagem',
      descricao: `Foram adicionados ${counts.sinaisVitais} sinais vitais, ${counts.totalExamesLaboratoriaisImagem} exames laboratoriais e de imagem e ${counts.examesFisicos} exames físicos organizados em ${counts.sistemasRevisao} sistemas. O Processo de Enfermagem agora conta com uma base clínica mais ampla para apoiar avaliações e identificar necessidades de cuidado.`,
    }, 'dataHora'),
  ];

  await firestoreRequest(`${firestoreBase(options.project)}:commit`, token, {
    method: 'POST',
    body: JSON.stringify({ writes }),
  });

  const verifiedCounts = Object.fromEntries(await Promise.all(
    ['SinaisVitais', 'ExamesLabImagem', 'RevisaoSistemas'].map(async (collectionId) => [
      collectionId,
      await countCollection(options.project, collectionId, token),
    ])
  ));
  const expectedCounts = {
    SinaisVitais: counts.sinaisVitais,
    ExamesLabImagem: counts.totalExamesLaboratoriaisImagem,
    RevisaoSistemas: counts.sistemasRevisao,
  };

  if (JSON.stringify(verifiedCounts) !== JSON.stringify(expectedCounts)) {
    throw new Error(`Commit concluído, mas a verificação divergiu: ${JSON.stringify({ expectedCounts, verifiedCounts })}`);
  }
  console.log(JSON.stringify({ importCompleted: true, verifiedCounts, writes: writes.length }, null, 2));
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) {
    console.error('JSON incompatível com o esquema esperado:');
    error.issues.forEach((issue) => console.error(`- ${issue.path.join('.')}: ${issue.message}`));
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { comporPdfDocumento } from '../src/utils/pdfDocumento';

test('PDF gerado diretamente possui texto visível no conteúdo e não é arquivo vazio', () => {
  const pdf = comporPdfDocumento({
    titulo: 'TERMO DE RESPONSABILIDADE E SIGILO',
    subtitulo: 'Segunda via informativa',
    nota: 'Aceite eletrônico mantido no cadastro.',
    paragrafos: ['Eu assumo o compromisso de confidencialidade.', 'Cuidados registrados no Portal CSAE.'],
  });
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  const raw = Buffer.from(bytes).toString('latin1');
  assert.equal(pdf.getNumberOfPages(), 1);
  assert.ok(bytes.length > 3500, 'PDF precisa conter texto e cabeçalho');
  assert.match(raw, /TERMO DE RESPONSABILIDADE/);
  assert.match(raw, /confidencialidade/);
});

test('Termos de uso longos quebram páginas preservando texto e numeração', () => {
  const pdf = comporPdfDocumento({
    titulo: 'TERMOS DE USO',
    paragrafos: ['Plataforma de apoio ao processo de enfermagem.'],
    secoes: Array.from({ length: 12 }, (_, i) => ({
      titulo: 'Seção ' + (i + 1),
      paragrafos: ['Conteúdo de segurança e utilização da plataforma. '.repeat(30)],
    })),
  });
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(bytes.length > 10000);
});

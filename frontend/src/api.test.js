import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from './api.js';

test('o cliente cobre as doze operações e envia os contratos da API', async () => {
  const calls = [];
  const api = createApi('/api/', async (url, options) => {
    calls.push([url, options.method, options.body ? JSON.parse(options.body) : undefined]);
    return options.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json([]);
  });
  const book = { titulo: 'O Cortiço', autor: 'Aluísio Azevedo', ano: 1890 };
  const reader = { nome: 'Ana', email: 'ana@example.com' };
  const loan = { livroId: 4, leitorId: 2 };
  await api.books(); await api.book(4); await api.createBook(book); await api.updateBook(4, book);
  assert.equal(await api.deleteBook(4), null); await api.available();
  await api.readers(); await api.reader(2); await api.createReader(reader);
  await api.loans(); await api.createLoan(loan); await api.returnLoan(8);
  assert.deepEqual(calls, [
    ['/api/livros', 'GET', undefined], ['/api/livros/4', 'GET', undefined],
    ['/api/livros', 'POST', book], ['/api/livros/4', 'PUT', book], ['/api/livros/4', 'DELETE', undefined],
    ['/api/livros/disponiveis', 'GET', undefined], ['/api/leitores', 'GET', undefined],
    ['/api/leitores/2', 'GET', undefined], ['/api/leitores', 'POST', reader],
    ['/api/emprestimos', 'GET', undefined], ['/api/emprestimos', 'POST', loan],
    ['/api/emprestimos/8/devolucao', 'PUT', undefined],
  ]);
});


test('mostra a mensagem do back-end em conflitos', async () => {
  const api = createApi('/api', async () => Response.json({ mensagem: 'O livro possui histórico.' }, { status: 409 }));
  await assert.rejects(api.deleteBook(4), /possui histórico/);
});

test('distingue API indisponível de resposta não JSON', async () => {
  const offline = createApi('/api', async () => { throw new TypeError('Connection refused'); });
  const wrongServer = createApi('/api', async () => new Response('<html></html>'));
  await assert.rejects(offline.books(), /Não foi possível conectar/);
  await assert.rejects(wrongServer.books(), /resposta inesperada/);
});
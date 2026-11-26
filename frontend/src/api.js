export function createApi(base = '/api', fetchImpl = globalThis.fetch) {
  const root = base.replace(/\/+$/, '');
  async function request(path, method = 'GET', body) {
    let response;
    try {
      response = await fetchImpl(root + path, {
        method,
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error('Não foi possível conectar à API. Verifique se o servidor da biblioteca está em execução.');
    }
    if (response.ok && response.status === 204) return null;
    const isJson = response.headers.get('content-type')?.includes('json');
    const data = isJson ? await response.json().catch(() => null) : null;
    if (!response.ok) {
      throw new Error(data?.mensagem || data?.detail || data?.title || `A API não concluiu a solicitação (HTTP ${response.status}).`);
    }
    if (data === null) throw new Error('A API devolveu uma resposta inesperada. Confira o endereço configurado.');
    return data;
  }
  return {
    books: () => request('/livros'),
    book: id => request(`/livros/${id}`),
    createBook: data => request('/livros', 'POST', data),
    updateBook: (id, data) => request(`/livros/${id}`, 'PUT', data),
    deleteBook: id => request(`/livros/${id}`, 'DELETE'),
    available: () => request('/livros/disponiveis'),
  };
}
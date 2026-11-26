import React from 'react';

export function BookForm({ item, busy, save }) {
  return <form onSubmit={event => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const data = { titulo: fd.get('titulo').trim(), autor: fd.get('autor').trim(), ano: Number(fd.get('ano')) };
    if (!data.titulo || !data.autor) { const field = event.currentTarget.elements[!data.titulo ? 'titulo' : 'autor']; field.setCustomValidity('Informe um valor que não seja apenas espaços.'); field.reportValidity(); return; }
    save(data);
  }}>
    <label>Título<input autoFocus required name="titulo" maxLength={200} defaultValue={item?.titulo ?? ''} placeholder="Ex.: A hora da estrela" onInput={e => e.target.setCustomValidity('')} /></label>
    <label>Autor(a)<input required name="autor" maxLength={150} defaultValue={item?.autor ?? ''} placeholder="Ex.: Clarice Lispector" onInput={e => e.target.setCustomValidity('')} /></label>
    <label>Ano de publicação<input required name="ano" type="number" min="1" max="9999" step="1" defaultValue={item?.ano ?? ''} placeholder="Ex.: 1977" /></label>
    <button className="button primary form-submit" disabled={busy}>{busy ? 'Salvando…' : item ? 'Salvar alterações' : 'Cadastrar livro'}</button>
  </form>;
}
export function ReaderForm({ busy, save }) {
  return <form onSubmit={event => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const nome = fd.get('nome').trim();
    if (!nome) { const field = event.currentTarget.elements.nome; field.setCustomValidity('Informe um nome que não seja apenas espaços.'); field.reportValidity(); return; }
    save({ nome, email: fd.get('email').trim() });
  }}>
    <label>Nome completo<input autoFocus required name="nome" maxLength={150} placeholder="Ex.: Maria da Silva" onInput={e => e.target.setCustomValidity('')} /></label>
    <label>E-mail<input required type="email" name="email" maxLength={254} placeholder="Ex.: maria@exemplo.com" /></label>
    <button className="button primary form-submit" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar leitor'}</button>
  </form>;
}
export function LoanForm({ data, busy, save }) {
  if (!data.available.length || !data.readers.length) return <div className="notice">Para registrar um empréstimo, é necessário ter pelo menos um livro disponível e um leitor cadastrado.</div>;
  return <form onSubmit={event => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    save({ livroId: Number(fd.get('livroId')), leitorId: Number(fd.get('leitorId')) });
  }}>
    <label>Livro disponível<select name="livroId" autoFocus required defaultValue=""><option value="" disabled>Selecione um livro</option>{data.available.map(book => <option value={book.id} key={book.id}>{book.titulo} · {book.autor} (#{book.id})</option>)}</select></label>
    <label>Leitor<select name="leitorId" required defaultValue=""><option value="" disabled>Selecione um leitor</option>{data.readers.map(reader => <option value={reader.id} key={reader.id}>{reader.nome} (#{reader.id})</option>)}</select></label>
    <button className="button primary form-submit" disabled={busy}>{busy ? 'Registrando…' : 'Registrar empréstimo'}</button>
  </form>;
}
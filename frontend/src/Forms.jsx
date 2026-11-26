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
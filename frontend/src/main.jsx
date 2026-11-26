import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createApi } from './api.js';
import { BookForm, ReaderForm, LoanForm } from './Forms.jsx';
import './styles.css';

const api = createApi(import.meta.env.VITE_API_URL || '/api');
const glyphs = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5M8 7h8m-8 4h6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm6 0a4 4 0 0 1-3 4m0-8a4 4 0 0 1 3 4',
  exchange: 'M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4',
  return: 'm9 10-5 5 5 5m-5-5h11a5 5 0 0 0 0-10h-3',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  search: 'M21 21l-4.5-4.5m2.5-5.5a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  sync: 'M20 7v5h-5M4 17v-5h5m-4-2a8 8 0 0 1 13-4l2 2M4 16l2 2a8 8 0 0 0 13-4',
  close: 'm6 6 12 12M18 6 6 18',
};
function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphs[name]} /></svg>;
}
const pages = {
  inicio: ['Visão geral', 'home', 'Acompanhe o acervo e a circulação em um só lugar.'],
  acervo: ['Acervo', 'book', 'Consulte os títulos, cadastre novos livros e veja o que está disponível.'],
  leitores: ['Leitores', 'users', 'Cadastre leitores ou consulte quem já tem acesso ao acervo.'],
  emprestimos: ['Empréstimos', 'exchange', 'Registre a retirada de livros e consulte o histórico de circulação.'],
  devolucoes: ['Devoluções', 'return', 'Encontre empréstimos em aberto e registre a entrega dos livros.'],
};
const blank = { books: [], readers: [], loans: [], available: [] };
const date = value => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value)) : '—';
const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
const matches = (query, ...values) => values.some(value => normalize(value).includes(normalize(query.trim())));
const currentPage = () => Object.hasOwn(pages, location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';

function Dialog({ title, children, dismiss, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) dismiss(); }} onClick={event => { if (event.target === event.currentTarget && !busy) dismiss(); }}>
    <div className="dialog-body">
      <div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" type="button" onClick={dismiss} disabled={busy} aria-label="Fechar"><Icon name="close" /></button></div>
      {children}
    </div>
  </dialog>;
}

function Empty({ title, text }) {
  return <div className="empty"><Icon name="search" size={26} /><strong>{title}</strong><p>{text}</p></div>;
}
function Search({ value, onChange, placeholder, label }) {
  return <label className="search"><Icon name="search" size={18} /><input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function Table({ labels, children }) {
  return <div className="table-scroll" role="region" aria-label="Tabela de resultados" tabIndex={0}><table><thead><tr>{labels.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Badge({ active, yes, no }) {
  return <span className={`badge ${active ? 'badge-green' : 'badge-gold'}`}><i />{active ? yes : no}</span>;
}
function App() {
  const [page, setPage] = useState(currentPage);
  const [data, setData] = useState(blank);
  const [state, setState] = useState({ loading: true, error: '', ready: false });
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const loadIndex = useRef(0);
  const dialogIndex = useRef(0);
  const heading = useRef(null);

  const refresh = useCallback(async () => {
    const index = ++loadIndex.current;
    setState(old => ({ ...old, loading: true, error: '' }));
    try {
      const [books, readers, loans, available] = await Promise.all([api.books(), api.readers(), api.loans(), api.available()]);
      if (![books, readers, loans, available].every(Array.isArray)) throw new Error('A API devolveu uma lista inválida.');
      if (index === loadIndex.current) {
        setData({ books, readers, loans, available });
        setState({ loading: false, error: '', ready: true });
      }
    } catch (error) {
      if (index === loadIndex.current) setState(old => ({ loading: false, error: error.message, ready: old.ready }));
    }
  }, []);
  useEffect(() => { refresh(); return () => { loadIndex.current++; }; }, [refresh]);
  useEffect(() => {
    const change = () => { setPage(currentPage()); setQuery(''); setAvailableOnly(false); setResult(''); requestAnimationFrame(() => heading.current?.focus()); };
    addEventListener('hashchange', change);
    return () => removeEventListener('hashchange', change);
  }, []);

  const opened = (type, item) => { dialogIndex.current++; setDialog({ type, item, error: '' }); };
  const dismiss = () => { dialogIndex.current++; setDialog(null); };
  async function details(type, id, edit = false) {
    const index = ++dialogIndex.current;
    setDialog({ type: 'loading', error: '' });
    try {
      const item = await (type === 'book' ? api.book(id) : api.reader(id));
      if (index === dialogIndex.current) setDialog({ type: edit ? 'editBook' : type, item, error: '' });
    } catch (error) {
      if (index === dialogIndex.current) setDialog({ type: 'loading', error: error.message });
    }
  }
  async function mutate(action, message) {
    setBusy(true);
    setDialog(old => ({ ...old, error: '' }));
    try {
      await action();
      dismiss();
      setResult(message);
      await refresh();
    } catch (error) {
      setDialog(old => old && ({ ...old, error: error.message }));
    } finally {
      setBusy(false);
    }
  }

  const bookById = new Map(data.books.map(book => [book.id, book]));
  const readerById = new Map(data.readers.map(reader => [reader.id, reader]));
  const availableIds = new Set(data.available.map(book => book.id));
  const bookName = loan => bookById.get(loan.livroId)?.titulo ?? `Livro #${loan.livroId}`;
  const readerName = loan => readerById.get(loan.leitorId)?.nome ?? `Leitor #${loan.leitorId}`;
  const openLoans = data.loans.filter(item => item.dataDevolucao == null);
  const latestLoans = [...data.loans].sort((a, b) => b.id - a.id);
  const displayBooks = (availableOnly ? data.available : data.books).filter(item => matches(query, item.titulo, item.autor, item.ano, item.id));
  const displayReaders = data.readers.filter(item => matches(query, item.nome, item.email, item.id));
  const displayLoans = (page === 'devolucoes' ? latestLoans.filter(item => item.dataDevolucao == null) : latestLoans).filter(item => matches(query, bookName(item), readerName(item), item.id));
  const loanTable = (list, showAction = false) => <Table labels={['Livro e leitor', 'Empréstimo', 'Devolução', 'Status', ...(showAction ? ['Ação'] : [])]}>
    {list.map(item => <tr key={item.id}><td><strong>{bookName(item)}</strong><span>{readerName(item)} · #{item.id}</span></td><td>{date(item.dataEmprestimo)}</td><td>{date(item.dataDevolucao)}</td><td><Badge active={item.dataDevolucao != null} yes="Devolvido" no="Em aberto" /></td>{showAction && <td>{item.dataDevolucao == null ? <button className="text-button" onClick={() => opened('return', item)} aria-label={`Devolver ${bookName(item)}`}>Devolver <Icon name="arrow" size={15} /></button> : '—'}</td>}</tr>)}
  </Table>;
  const count = value => state.ready ? value : '—';
  const copy = {
    loading: 'Consulta', newBook: 'Cadastrar livro', editBook: 'Editar livro', book: 'Detalhes do livro', deleteBook: 'Excluir livro',
    newReader: 'Cadastrar leitor', reader: 'Detalhes do leitor', newLoan: 'Registrar empréstimo', return: 'Registrar devolução',
  };
  const action = { acervo: ['Novo livro', 'newBook'], leitores: ['Novo leitor', 'newReader'], emprestimos: ['Novo empréstimo', 'newLoan'] }[page];

  return <>
    <a className="skip" href="#conteudo" onClick={e => { e.preventDefault(); heading.current?.focus(); }}>Ir para o conteúdo</a>
    <aside className="sidebar">
      <a className="brand" href="#inicio"><div className="brand-mark"><Icon name="book" size={24} /></div><div><strong>Biblioteca</strong><small>Gestão do acervo</small></div></a>
      <p className="nav-title">ESPAÇO DE TRABALHO</p>
      <nav aria-label="Navegação principal">{Object.entries(pages).map(([key, [label, glyph]]) => <a key={key} href={`#${key}`} aria-current={page === key ? 'page' : undefined}><Icon name={glyph} /><span>{label}</span></a>)}</nav>
      <div className="sidebar-foot"><span className={`status-dot ${state.error ? 'offline' : ''}`} />{state.loading ? 'Atualizando dados' : state.error ? 'Falha ao carregar' : 'API conectada'}</div>
    </aside>
    <main id="conteudo">
      <header className="page-head">
        <div><div className="eyebrow">SISTEMA DE BIBLIOTECA</div><h1 ref={heading} tabIndex="-1">{pages[page][0]}</h1><p>{pages[page][2]}</p></div>
        <div className="header-controls"><button className="button secondary" onClick={refresh} disabled={state.loading}><Icon name="sync" size={17} /><span>Atualizar</span></button>{action && <button className="button primary" onClick={() => opened(action[1])} disabled={!state.ready}><Icon name="plus" size={18} />{action[0]}</button>}</div>
      </header>
      {state.loading && <p className="sr-only" role="status">Carregando dados da biblioteca…</p>}
      {state.error && <div className="notice error" role="alert">{state.error} {state.ready && 'Os dados abaixo são da última leitura.'} <button className="text-button" onClick={refresh}>Tentar novamente</button></div>}
      {result && <div className="notice success" role="status">{result}<button className="icon-button" onClick={() => setResult('')} aria-label="Dispensar confirmação"><Icon name="close" size={16} /></button></div>}
      {page === 'inicio' && <>
        <section className="hero">
          <div><span className="hero-kicker">ORGANIZE. EMPRESTE. ACOMPANHE.</span><h2>Uma biblioteca<br />em movimento.</h2><p>Do primeiro cadastro à devolução, gerencie cada etapa da circulação.</p><a className="button hero-button" href="#acervo">Conhecer o acervo <Icon name="arrow" size={17} /></a></div>
          <div className="book-art" aria-hidden="true"><i /><i /><i /><i /><b>EX<br/>LIBRIS</b></div>
        </section>
        <div className="stats" aria-label="Resumo da biblioteca">
          {[
            ['Títulos no acervo', data.books.length, 'book', 'acervo', 'Livros cadastrados'],
            ['Livros disponíveis', data.available.length, 'home', 'acervo', 'Prontos para empréstimo'],
            ['Leitores cadastrados', data.readers.length, 'users', 'leitores', 'Pessoas com cadastro'],
            ['Empréstimos em aberto', openLoans.length, 'exchange', 'devolucoes', 'Aguardando devolução'],
          ].map(([label, amount, icon, dest, hint]) => <a className="stat" key={label} href={`#${dest}`}><span className="stat-icon"><Icon name={icon} size={19} /></span><span>{label}</span><strong>{count(amount)}</strong><small>{hint}</small></a>)}
        </div>
        <section className="panel"><div className="panel-head"><div><h2>Circulação recente</h2><p>Últimos empréstimos registrados.</p></div><a className="text-button" href="#emprestimos">Ver histórico <Icon name="arrow" size={16} /></a></div>{latestLoans.length ? loanTable(latestLoans.slice(0, 5)) : !state.error && <Empty title={state.loading ? 'Carregando circulação…' : 'Nenhum empréstimo registrado'} text="Os próximos registros aparecem aqui." />}</section>
      </>}
      {page === 'acervo' && <section className="panel">
        <div className="panel-head"><div><h2>Catálogo de livros</h2><p>{count(displayBooks.length)} {displayBooks.length === 1 ? 'título' : 'títulos'}</p></div><div className="tools"><Search value={query} onChange={setQuery} label="Buscar livros" placeholder="Título, autor ou ID" /><label className="toggle"><input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} /> Só disponíveis</label></div></div>
        {displayBooks.length ? <Table labels={['Livro', 'Ano', 'Disponibilidade', 'Ações']}>{displayBooks.map(item => <tr key={item.id}><td><button className="row-title" onClick={() => details('book', item.id)}>{item.titulo}</button><span>{item.autor} · #{item.id}</span></td><td>{item.ano}</td><td><Badge active={availableIds.has(item.id)} yes="Disponível" no="Emprestado" /></td><td><div className="row-actions"><button onClick={() => details('book', item.id, true)} aria-label={`Editar ${item.titulo}`}>Editar</button><button onClick={() => opened('deleteBook', item)} aria-label={`Excluir ${item.titulo}`}>Excluir</button></div></td></tr>)}</Table> : !state.error && <Empty title={state.loading ? 'Carregando acervo…' : 'Nenhum livro encontrado'} text="Tente outra busca ou cadastre um novo título." />}
      </section>}
      {page === 'leitores' && <section className="panel">
        <div className="panel-head"><div><h2>Lista de leitores</h2><p>{count(displayReaders.length)} {displayReaders.length === 1 ? 'leitor' : 'leitores'}</p></div><Search value={query} onChange={setQuery} label="Buscar leitores" placeholder="Nome, e-mail ou ID" /></div>
        {displayReaders.length ? <Table labels={['Leitor', 'E-mail', 'ID']}>{displayReaders.map(item => <tr key={item.id}><td><button className="row-title" onClick={() => details('reader', item.id)}>{item.nome}</button></td><td>{item.email}</td><td>#{item.id}</td></tr>)}</Table> : !state.error && <Empty title={state.loading ? 'Carregando leitores…' : 'Nenhum leitor encontrado'} text="Tente outra busca ou comece cadastrando um leitor." />}
      </section>}
      {(page === 'emprestimos' || page === 'devolucoes') && <section className="panel">
        <div className="panel-head"><div><h2>{page === 'emprestimos' ? 'Histórico de empréstimos' : 'Empréstimos para devolver'}</h2><p>{count(displayLoans.length)} {displayLoans.length === 1 ? 'registro' : 'registros'}</p></div><Search value={query} onChange={setQuery} label="Buscar empréstimos" placeholder="Livro, leitor ou ID" /></div>
        {displayLoans.length ? loanTable(displayLoans, true) : !state.error && <Empty title={state.loading ? 'Carregando empréstimos…' : 'Nenhum registro encontrado'} text={page === 'devolucoes' ? 'Só empréstimos em aberto aparecem aqui.' : 'Novos empréstimos ficam disponíveis no histórico.'} />}
      </section>}
      <footer>Biblioteca · Gestão de acervo e circulação</footer>
    </main>
    {dialog && <Dialog title={copy[dialog.type]} busy={busy} dismiss={dismiss}>
      {dialog.error && <div className="notice error" role="alert">{dialog.error}</div>}
      {dialog.type === 'loading' && !dialog.error && <p role="status">Consultando a API…</p>}
      {dialog.type === 'newBook' && <BookForm busy={busy} save={value => mutate(() => api.createBook(value), 'Livro cadastrado.')} />}
      {dialog.type === 'editBook' && <BookForm busy={busy} item={dialog.item} save={value => mutate(() => api.updateBook(dialog.item.id, value), 'Livro atualizado.')} />}
      {dialog.type === 'newReader' && <ReaderForm busy={busy} save={value => mutate(() => api.createReader(value), 'Leitor cadastrado.')} />}
      {dialog.type === 'newLoan' && <LoanForm data={data} busy={busy} save={value => mutate(() => api.createLoan(value), 'Empréstimo registrado.')} />}
      {dialog.type === 'book' && <dl className="details"><dt>Título</dt><dd>{dialog.item.titulo}</dd><dt>Autor(a)</dt><dd>{dialog.item.autor}</dd><dt>Ano</dt><dd>{dialog.item.ano}</dd><dt>ID</dt><dd>#{dialog.item.id}</dd></dl>}
      {dialog.type === 'reader' && <dl className="details"><dt>Nome</dt><dd>{dialog.item.nome}</dd><dt>E-mail</dt><dd>{dialog.item.email}</dd><dt>ID</dt><dd>#{dialog.item.id}</dd></dl>}
      {dialog.type === 'deleteBook' && <><p>Excluir <strong>{dialog.item.titulo}</strong> do acervo? Esta ação não pode ser desfeita. Livros com histórico de empréstimos não podem ser excluídos.</p><div className="dialog-actions"><button className="button secondary" onClick={dismiss} disabled={busy} autoFocus>Cancelar</button><button className="button danger" disabled={busy} onClick={() => mutate(() => api.deleteBook(dialog.item.id), 'Livro excluído.')}>{busy ? 'Excluindo…' : 'Excluir livro'}</button></div></>}
      {dialog.type === 'return' && <><p>Confirma a devolução de <strong>{bookName(dialog.item)}</strong> por <strong>{readerName(dialog.item)}</strong>?</p><div className="dialog-actions"><button className="button secondary" onClick={dismiss} disabled={busy}>Cancelar</button><button className="button primary" disabled={busy} onClick={() => mutate(() => api.returnLoan(dialog.item.id), 'Devolução registrada.')}>{busy ? 'Registrando…' : 'Confirmar devolução'}</button></div></>}
    </Dialog>}
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
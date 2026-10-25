using Biblioteca.Data;
using Biblioteca.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BibliotecaContext>(options =>
    options.UseSqlite("Data Source=biblioteca.db"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Cria o arquivo do banco e as tabelas na primeira execução.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BibliotecaContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/livros", (BibliotecaContext db) =>
    db.Livros.OrderBy(l => l.Titulo).ToList());
app.MapGet("/livros/{id:int}", IResult (int id, BibliotecaContext db) =>
{
    var livro = db.Livros.Find(id);
    if (livro == null)
        return Results.NotFound(new { mensagem = "Livro não encontrado." });

    return Results.Ok(livro);
});
app.MapPost("/livros", (Livro dados, BibliotecaContext db) =>
{
    var livro = new Livro { Titulo = dados.Titulo, Autor = dados.Autor, Ano = dados.Ano };
    db.Livros.Add(livro);
    db.SaveChanges();
    return Results.Created($"/livros/{livro.Id}", livro);
});
app.MapPut("/livros/{id:int}", IResult (int id, Livro dados, BibliotecaContext db) =>
{
    var livro = db.Livros.Find(id);
    if (livro == null)
        return Results.NotFound(new { mensagem = "Livro não encontrado." });

    livro.Titulo = dados.Titulo;
    livro.Autor = dados.Autor;
    livro.Ano = dados.Ano;
    db.SaveChanges();
    return Results.Ok(livro);
});

app.MapDelete("/livros/{id:int}", IResult (int id, BibliotecaContext db) =>
{
    var livro = db.Livros.Find(id);
    if (livro == null)
        return Results.NotFound(new { mensagem = "Livro não encontrado." });

    // Mantém o histórico, inclusive dos empréstimos já devolvidos.
    if (db.Emprestimos.Any(e => e.LivroId == id))
        return Results.Conflict(new { mensagem = "O livro possui histórico de empréstimos e não pode ser excluído." });

    db.Livros.Remove(livro);
    db.SaveChanges();
    return Results.NoContent();
});
app.MapGet("/leitores", (BibliotecaContext db) => db.Leitores.ToList());
app.MapGet("/leitores/{id:int}", IResult (int id, BibliotecaContext db) =>
{
    var leitor = db.Leitores.Find(id);
    if (leitor == null)
        return Results.NotFound(new { mensagem = "Leitor não encontrado." });

    return Results.Ok(leitor);
});

app.MapPost("/leitores", (Leitor dados, BibliotecaContext db) =>
{
    var leitor = new Leitor { Nome = dados.Nome, Email = dados.Email };
    db.Leitores.Add(leitor);
    db.SaveChanges();
    return Results.Created($"/leitores/{leitor.Id}", leitor);
});

app.MapGet("/emprestimos", (BibliotecaContext db) => db.Emprestimos.ToList());

app.MapPost("/emprestimos", (NovoEmprestimo dados, BibliotecaContext db) =>
{
    var livro = db.Livros.Find(dados.LivroId);
    if (livro == null) return Results.NotFound(new { mensagem = "Livro não encontrado." });

    var leitor = db.Leitores.Find(dados.LeitorId);
    if (leitor == null) return Results.NotFound(new { mensagem = "Leitor não encontrado." });

    // Regra de Negócio: Verifica se o livro já está emprestado no momento
    var livroIndisponivel = db.Emprestimos.Any(e => e.LivroId == dados.LivroId && e.DataDevolucao == null);
    if (livroIndisponivel) return Results.BadRequest(new { mensagem = "Livro indisponível para empréstimo." });

    var emprestimo = new Emprestimo
    {
        LivroId = dados.LivroId,
        LeitorId = dados.LeitorId,
        DataEmprestimo = DateTime.Now
    };

    db.Emprestimos.Add(emprestimo);
    db.SaveChanges();
    return Results.Created($"/emprestimos/{emprestimo.Id}", emprestimo);
});

app.MapGet("/livros/disponiveis", (BibliotecaContext db) =>
{
    var livrosEmprestadosIds = db.Emprestimos
        .Where(e => e.DataDevolucao == null)
        .Select(e => e.LivroId)
        .ToList();

    var livrosDisponiveis = db.Livros
        .Where(l => !livrosEmprestadosIds.Contains(l.Id))
        .ToList();

    return Results.Ok(livrosDisponiveis);
});

app.MapPut("/emprestimos/{id:int}/devolucao", (int id, BibliotecaContext db) =>
{
    var emprestimo = db.Emprestimos.Find(id);
    if (emprestimo == null) return Results.NotFound(new { mensagem = "Empréstimo não encontrado." });
    if (emprestimo.DataDevolucao != null) return Results.BadRequest(new { mensagem = "Este empréstimo já foi devolvido." });

    // Regra de Negócio: Efetua a devolução
    emprestimo.DataDevolucao = DateTime.Now;
    db.SaveChanges();
    return Results.Ok(emprestimo);
});

app.Run();

record NovoEmprestimo(int LivroId, int LeitorId);
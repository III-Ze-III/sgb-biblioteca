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

app.Run();
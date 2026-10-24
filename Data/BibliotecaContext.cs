using Biblioteca.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Data;

public class BibliotecaContext : DbContext
{
    public BibliotecaContext(DbContextOptions<BibliotecaContext> options) : base(options)
    {
    }

    public DbSet<Livro> Livros => Set<Livro>();
    public DbSet<Leitor> Leitores => Set<Leitor>();
    public DbSet<Emprestimo> Emprestimos => Set<Emprestimo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Emprestimo>()
            .HasOne(e => e.Livro)
            .WithMany()
            .HasForeignKey(e => e.LivroId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Emprestimo>()
            .HasOne(e => e.Leitor)
            .WithMany()
            .HasForeignKey(e => e.LeitorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

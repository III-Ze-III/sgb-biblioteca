# Sistema de Gerenciamento de Biblioteca (SGB Biblioteca)

## Identificação do projeto

- **Projeto:** Sistema de Gerenciamento de Biblioteca (SGB Biblioteca)
- **Integrantes:** Gabriel Vitor Batista Luiz; Vitor Bruno de Souza da Silva; Leandro Luiz De Mattos
- **Curso:** Ciência da Computação
- **Turma:** 4º Período - Noturno

## Resumo

O SGB Biblioteca é uma API web para apoiar o gerenciamento de um acervo e de suas operações de empréstimo. O sistema permite cadastrar, consultar, alterar e excluir livros (respeitando o histórico de empréstimos), cadastrar e consultar leitores, registrar empréstimos e devoluções e consultar quais livros estão disponíveis. Desenvolvido em C# com ASP.NET Core, utiliza SQLite para persistir os dados e disponibiliza a documentação interativa dos endpoints pelo Swagger.

## Funcionalidades

- Cadastrar, listar, consultar, atualizar e excluir livros.
- Cadastrar e listar leitores, além de consultar um leitor pelo identificador.
- Registrar empréstimos e consultar o histórico de empréstimos.
- Impedir o empréstimo de um livro que já esteja emprestado.
- Consultar livros disponíveis para empréstimo.
- Registrar a devolução de um livro emprestado.
- Explorar e testar a API pela interface Swagger.

## Descrição das funcionalidades

### Gerenciamento de livros

O sistema permite criar livros informando título, autor e ano de publicação. Os livros podem ser listados, consultados individualmente e atualizados. A exclusão é permitida somente quando não há empréstimos associados ao livro, preservando o histórico registrado.

### Gerenciamento de leitores

É possível cadastrar leitores com nome e e-mail, listar os registros e consultar um leitor específico pelo identificador.

### Empréstimos e devoluções

Um empréstimo associa um livro a um leitor e registra automaticamente a data do empréstimo. O sistema verifica se os identificadores informados existem e não permite emprestar novamente um livro que ainda não foi devolvido. A devolução é registrada no empréstimo existente; uma segunda tentativa de devolução é recusada.

### Consulta de disponibilidade e histórico

Os empréstimos podem ser listados para consulta do histórico. A rota de disponibilidade apresenta os livros que não possuem empréstimo em aberto.

### Documentação da API

Ao iniciar a aplicação, a interface Swagger fica disponível em `/swagger`, permitindo consultar e experimentar os endpoints.

## Como executar

É necessário ter o SDK do .NET 8 instalado. Na pasta do projeto, execute:

```bash
dotnet run --urls http://localhost:5000
```

Abra `http://localhost:5000/swagger` para acessar a documentação interativa. O banco SQLite (`biblioteca.db`) e suas tabelas são criados na primeira execução.

Os exemplos de requisições HTTP estão em [`Tests/Biblioteca.http`](Tests/Biblioteca.http).

## Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/livros` | Lista os livros. |
| `GET` | `/livros/{id}` | Consulta um livro pelo identificador. |
| `POST` | `/livros` | Cadastra um livro. |
| `PUT` | `/livros/{id}` | Atualiza um livro. |
| `DELETE` | `/livros/{id}` | Exclui um livro sem histórico de empréstimos. |
| `GET` | `/leitores` | Lista os leitores. |
| `GET` | `/leitores/{id}` | Consulta um leitor pelo identificador. |
| `POST` | `/leitores` | Cadastra um leitor. |
| `GET` | `/emprestimos` | Lista os empréstimos. |
| `POST` | `/emprestimos` | Registra um empréstimo. |
| `GET` | `/livros/disponiveis` | Lista os livros disponíveis. |
| `PUT` | `/emprestimos/{id}/devolucao` | Registra a devolução de um empréstimo. |

## Repositório

Este repositório é a entrega do projeto e pode ser acessado em [III-Ze-III/sgb-biblioteca](https://github.com/III-Ze-III/sgb-biblioteca).

## Uso de IA

- **Ferramenta utilizada:** assistente de IA Copilot SDK no VS Code.
- **Forma de uso:** a IA foi solicitada a elaborar esta documentação com base na estrutura e no código do projeto. O pedido especificou as seções obrigatórias do README; o conteúdo foi ajustado para descrever as funcionalidades e rotas existentes.
- **Revisões realizadas pela equipe:** a equipe conferiu o funcionamento das rotas utilizando o arquivo de requisições HTTP do projeto.

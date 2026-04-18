# Base de datos (Mermaid)

Diagrama ER basado en los modelos de `src/modules`.

```mermaid
erDiagram
  USERS {
    ObjectId _id PK
    string name
    string email UK
    string passwordHash
    string role
    boolean active
    date createdAt
    date updatedAt
  }

  AUTHORS {
    ObjectId _id PK
    string name
    string bio
    string avatarUrl
    ObjectId userId FK
    date createdAt
    date updatedAt
  }

  CATEGORIES {
    ObjectId _id PK
    string name
    string slug UK
    string description
    date createdAt
    date updatedAt
  }

  ARTICLES {
    ObjectId _id PK
    string title
    string slug UK
    string excerpt
    string content
    string featuredImageUrl
    string status
    boolean isFeatured
    ObjectId authorId FK
    ObjectId[] categoryIds FK
    date scheduledAt
    date publishedAt
    number views
    date createdAt
    date updatedAt
  }

  SUBSCRIBERS {
    ObjectId _id PK
    string username UK
    string email UK
    string passwordHash
    string role
    string status
    boolean active
    date createdAt
    date updatedAt
  }

  IMAGES {
    ObjectId _id PK
    string filename
    string url
    string mimeType
    number size
    date createdAt
  }

  USERS ||--o{ AUTHORS : "userId"
  AUTHORS ||--o{ ARTICLES : "authorId"
  CATEGORIES }o--o{ ARTICLES : "categoryIds[]"
```

Notas:
- `featuredImageUrl` en `ARTICLES` es una URL (no FK directa a `IMAGES`).
- `USERS` y `SUBSCRIBERS` son colecciones separadas para sesiones/admin y lectores.


# Endpoints · Entrada de documentación

Este archivo es el **índice principal** para pruebas manuales de la API.

## Módulos

- [Auth](./src/modules/auth/all.md)
- [Dashboard](./src/modules/dashboard/all.md)
- [Article](./src/modules/article/all.md)
- [Category](./src/modules/category/all.md)
- [Author](./src/modules/author/all.md)
- [Social](./src/modules/social/all.md)
- [Image](./src/modules/image/all.md)
- [Public](./src/modules/public/all.md)
- [Subscribers](./src/modules/subscribers/all.md)
- [Favorites](./src/modules/favorites/all.md)
- [Newsletter](./src/modules/newsletter/all.md)

## Flujo de datos (Mermaid)

```mermaid
flowchart LR
  C[Cliente Web/Admin] --> A[API Express /api/v1]
  A --> M1[Auth]
  A --> M2[Dashboard]
  A --> M3[Article]
  A --> M4[Category]
  A --> M5[Author]
  A --> M6[Social]
  A --> M7[Image]
  A --> M8[Public]
  A --> M9[Subscribers]
  A --> M10[Favorites]
  A --> M11[Newsletter]

  M1 --> J[JWT Cookie]
  M8 --> SJ[Subscriber JWT Cookie]
  J --> A
  SJ --> A

  M2 --> DB[(MongoDB)]
  M3 --> DB
  M4 --> DB
  M5 --> DB
  M6 --> DB
  M7 --> DB
  M8 --> DB
  M9 --> DB
  M10 --> DB
  M11 --> DB

  M7 --> FS[(uploads/featured)]
  FS --> M8
```

## Relaciones de base de datos (Mermaid)

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
    date createdAt
    date updatedAt
  }

  SOCIALS {
    ObjectId _id PK
    ObjectId authorId FK
    string platform
    string url
    string label
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

  FAVORITES {
    ObjectId _id PK
    ObjectId subscriberId FK
    ObjectId articleId FK
    date addedAt
  }

  IMAGES {
    ObjectId _id PK
    string filename
    string url
    string mimeType
    number size
    date createdAt
  }

  AUTHORS ||--o{ ARTICLES : "authorId"
  AUTHORS ||--o{ SOCIALS : "authorId"
  CATEGORIES }o--o{ ARTICLES : "categoryIds[]"
  SUBSCRIBERS ||--o{ FAVORITES : "subscriberId"
  ARTICLES ||--o{ FAVORITES : "articleId"
```

## Cómo usar esta documentación

1. Empieza por el módulo que vas a probar desde la lista anterior.
2. Usa su `all.md` como guía de endpoints, payloads y respuestas esperadas.
3. Para pruebas con sesión/token, autentícate primero en **Auth** y reutiliza credenciales en el resto de módulos.
4. Prueba flujo feliz + errores comunes (validación, permisos, recursos inexistentes).
5. Si cambias un endpoint, actualiza primero su `all.md` del módulo y deja este archivo como índice.

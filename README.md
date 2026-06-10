# Financial Health Backend

API REST para gestión de finanzas personales por meses.

## Inicio rápido

```bash
npm install
npm run dev
```

Servidor en `http://localhost:3001`.

---

## Endpoints

### Health

```
GET /api/health
```

```json
// Response 200
{ "status": "ok" }
```

---

### Resumen global

```
GET /api/resumen
```

```json
// Response 200
{
  "totalMeses": 3,
  "totalIngresos": 5000,
  "totalGastos": 3200,
  "balance": 1800
}
```

---

### Meses

#### Listar meses

```
GET /api/meses
```

```json
// Response 200
[
  {
    "id": "clx...",
    "label": "Enero 2025",
    "year": 2025,
    "month": 1,
    "ingresos": [],
    "gastos": [],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Obtener un mes

```
GET /api/meses/:id
```

```json
// Response 200
{
  "id": "clx...",
  "label": "Enero 2025",
  "year": 2025,
  "month": 1,
  "ingresos": [...],
  "gastos": [...],
  "createdAt": "...",
  "updatedAt": "..."
}

// Response 404
{ "error": "Mes no encontrado" }
```

#### Crear mes

```
POST /api/meses
Content-Type: application/json
```

```json
// Request
{
  "label": "Enero 2025",
  "year": 2025,
  "month": 1,
  "ingresos": [{ "concepto": "Sueldo", "monto": 3000 }],
  "gastos": [{ "concepto": "Alquiler", "monto": 800, "categoria": "vivienda", "fin": "fijo" }]
}

// Response 201
{
  "id": "clx...",
  "label": "Enero 2025",
  "year": 2025,
  "month": 1,
  "ingresos": [...],
  "gastos": [...],
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Eliminar mes

```
DELETE /api/meses/:id

// Response 204 (sin contenido)
```

---

### Gastos (anidados bajo un mes)

#### Listar gastos de un mes

```
GET /api/meses/:monthId/gastos
```

```json
// Response 200
[
  {
    "id": "clx...",
    "concepto": "Alquiler",
    "monto": 800,
    "categoria": "vivienda",
    "fin": "fijo",
    "monthId": "clx..."
  }
]
```

#### Crear gasto

```
POST /api/meses/:monthId/gastos
Content-Type: application/json
```

```json
// Request
{
  "concepto": "Supermercado",
  "monto": 150.50,
  "categoria": "alimentacion",
  "fin": "variable"
}

// Response 201
{
  "id": "clx...",
  "concepto": "Supermercado",
  "monto": 150.5,
  "categoria": "alimentacion",
  "fin": "variable",
  "monthId": "clx..."
}
```

#### Actualizar gasto

```
PUT /api/meses/:monthId/gastos/:gastoId
Content-Type: application/json
```

```json
// Request
{
  "concepto": "Supermercado",
  "monto": 200,
  "categoria": "alimentacion",
  "fin": "variable"
}

// Response 200
{
  "id": "clx...",
  "concepto": "Supermercado",
  "monto": 200,
  "categoria": "alimentacion",
  "fin": "variable",
  "monthId": "clx..."
}
```

#### Eliminar gasto

```
DELETE /api/meses/:monthId/gastos/:gastoId

// Response 204 (sin contenido)
```

---

### Ingresos (anidados bajo un mes)

#### Listar ingresos de un mes

```
GET /api/meses/:monthId/ingresos
```

```json
// Response 200
[
  {
    "id": "clx...",
    "concepto": "Sueldo",
    "monto": 3000,
    "monthId": "clx..."
  }
]
```

#### Crear ingreso

```
POST /api/meses/:monthId/ingresos
Content-Type: application/json
```

```json
// Request
{
  "concepto": "Freelance",
  "monto": 500
}

// Response 201
{
  "id": "clx...",
  "concepto": "Freelance",
  "monto": 500,
  "monthId": "clx..."
}
```

#### Actualizar ingreso

```
PUT /api/meses/:monthId/ingresos/:ingresoId
Content-Type: application/json
```

```json
// Request
{
  "concepto": "Freelance",
  "monto": 600
}

// Response 200
{
  "id": "clx...",
  "concepto": "Freelance",
  "monto": 600,
  "monthId": "clx..."
}
```

#### Eliminar ingreso

```
DELETE /api/meses/:monthId/ingresos/:ingresoId

// Response 204 (sin contenido)
```

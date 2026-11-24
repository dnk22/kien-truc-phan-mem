import type { OpenAPIObject } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
const string: SchemaObject = { type: 'string' };
const uuid: SchemaObject = { type: 'string', format: 'uuid' };
const integer: SchemaObject = {
  type: 'integer',
  minimum: 1,
  maximum: 2147483647,
};
const money: SchemaObject = {
  type: 'integer',
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
};
const nullable: SchemaObject = { type: 'string', nullable: true };
const object = (
  properties: Record<string, SchemaObject>,
  required: string[] = [],
): SchemaObject => ({
  type: 'object',
  additionalProperties: false,
  properties,
  ...(required.length ? { required } : {}),
});
const status = object(
  { status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
  ['status'],
);
const category = object(
  {
    code: { ...string, maxLength: 64 },
    name: { ...string, maxLength: 200 },
    description: { ...nullable, maxLength: 2000 },
  },
  ['code', 'name'],
);
const product = object(
  {
    ...category.properties,
    categoryId: uuid,
    barcode: { ...nullable, maxLength: 64 },
    unit: { ...string, maxLength: 50 },
    sellingPrice: integer,
    imageUrl: { ...nullable, format: 'uri' },
  },
  ['code', 'name', 'categoryId', 'unit', 'sellingPrice'],
);
const supplier = object(
  { code: string, name: string, phone: nullable, address: nullable },
  ['code', 'name'],
);
const receipt = object(
  {
    supplierId: uuid,
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      description: 'Distinct productId values; prices are integer VND.',
      items: object({ productId: uuid, quantity: integer, unitCost: integer }, [
        'productId',
        'quantity',
        'unitCost',
      ]),
    },
  },
  ['supplierId', 'items'],
);
const bodies: Record<string, SchemaObject> = {
  'post /api/v1/categories': category,
  'patch /api/v1/categories/{id}': { ...category, required: [] },
  'patch /api/v1/categories/{id}/status': status,
  'post /api/v1/products': product,
  'patch /api/v1/products/{id}': { ...product, required: [] },
  'patch /api/v1/products/{id}/status': status,
  'patch /api/v1/products/{id}/price': object({ sellingPrice: integer }, [
    'sellingPrice',
  ]),
  'post /api/v1/suppliers': supplier,
  'patch /api/v1/suppliers/{id}': { ...supplier, required: [] },
  'patch /api/v1/suppliers/{id}/status': status,
  'post /api/v1/purchase-receipts': receipt,
  'patch /api/v1/purchase-receipts/{id}': receipt,
  'post /api/v1/inventory/adjustments': object(
    {
      productId: uuid,
      expectedVersion: { type: 'integer', minimum: 0 },
      counted: { type: 'integer', minimum: 0, maximum: 2147483647 },
      reason: { ...string, maxLength: 2000 },
    },
    ['productId', 'expectedVersion', 'counted', 'reason'],
  ),
  'post /api/v1/sales/checkout/prepare': object(
    {
      items: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        description:
          'Distinct productId values; server resolves authoritative price.',
        items: object({ productId: uuid, quantity: integer }, [
          'productId',
          'quantity',
        ]),
      },
    },
    ['items'],
  ),
  'post /api/v1/sales/checkout/{id}/confirm': {
    oneOf: [
      object(
        { method: { type: 'string', enum: ['CASH'] }, amountReceived: money },
        ['method', 'amountReceived'],
      ),
      object(
        {
          method: { type: 'string', enum: ['BANK_TRANSFER'] },
          confirmed: { type: 'boolean', enum: [true] },
        },
        ['method', 'confirmed'],
      ),
    ],
  },
};
export function completePublicDocument(document: OpenAPIObject): void {
  document.info.version = '1.0.0-review';
  document.info.description =
    'MiniMart V1 public allowlist. Integer VND, UTC timestamps; reporting date ranges use GMT+7. Cookie actions require an allowed Origin and X-CSRF-Protection: 1. Checkout is prepare then confirm; never collect payment twice after an ambiguous response.';
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/api/v1/')) continue;
    for (const method of ['get', 'post', 'patch'] as const) {
      const op = item[method];
      if (!op) continue;
      op.parameters ??= [];
      for (const match of path.matchAll(/\{([^}]+)\}/g)) {
        const name = match[1]!;
        if (
          !op.parameters.some(
            (p) => 'name' in p && p.in === 'path' && p.name === name,
          )
        )
          op.parameters.push({
            name,
            in: 'path',
            required: true,
            schema: uuid,
          });
      }
      const schema = bodies[method + ' ' + path];
      if (schema)
        op.requestBody = {
          required: true,
          content: { 'application/json': { schema } },
        };
      if (path.includes('/sales/checkout/') && !path.endsWith('/cancel'))
        op.parameters.push({
          name: 'Idempotency-Key',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
            pattern: '^[a-zA-Z0-9._:-]+$',
          },
          description:
            'Reuse the same key and exact payload after timeouts; payload conflict returns 409.',
        });
      if (
        method === 'get' &&
        [
          '/categories',
          '/products',
          '/suppliers',
          '/purchase-receipts',
          '/inventory',
          '/inventory/movements',
          '/inventory/adjustments',
          '/invoices',
        ].some((p) => path === '/api/v1' + p)
      ) {
        for (const [name, s] of Object.entries({
          page: { type: 'integer', minimum: 1, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string' },
          status: { type: 'string' },
          productId: uuid,
          supplierId: uuid,
          categoryId: uuid,
          lowStock: { type: 'boolean' },
          sortBy: {
            type: 'string',
            enum: ['name', 'sellingPrice', 'createdAt'],
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        })) {
          const queryFields: Record<string, string[]> = {
            '/api/v1/categories': ['search', 'status', 'sortBy', 'sortOrder'],
            '/api/v1/products': [
              'search',
              'status',
              'categoryId',
              'sortBy',
              'sortOrder',
            ],
            '/api/v1/suppliers': ['search', 'status'],
            '/api/v1/purchase-receipts': ['supplierId', 'status'],
            '/api/v1/inventory': ['search', 'productId', 'lowStock'],
            '/api/v1/inventory/movements': ['productId'],
            '/api/v1/inventory/adjustments': ['productId', 'status'],
            '/api/v1/invoices': ['search', 'status'],
          };
          const allowed =
            name === 'page' ||
            name === 'pageSize' ||
            (queryFields[path] ?? []).includes(name);
          if (
            allowed &&
            !op.parameters.some((p) => 'name' in p && p.name === name)
          )
            op.parameters.push({
              name,
              in: 'query',
              required: false,
              schema: s as SchemaObject,
            });
        }
      }
      if (path === '/api/v1/reports/revenue')
        for (const name of ['from', 'to'])
          op.parameters.push({
            name,
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            description:
              'Inclusive calendar day in Asia/Ho_Chi_Minh; maximum 366 days.',
          });
      for (const [code, response] of Object.entries(op.responses)) {
        if (!response || !/^2\d\d$/.test(code) || '$ref' in response) continue;
        response.description =
          'Success envelope; lists include page/pageSize/total/totalPages in meta.';
        response.content = {
          'application/json': {
            schema: object(
              {
                success: { type: 'boolean', enum: [true] },
                data: {
                  description:
                    'Resource fields documented in docs/api-index.md and service contracts.',
                },
                meta: object(
                  {
                    correlationId: string,
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                  ['correlationId'],
                ),
              },
              ['success', 'data', 'meta'],
            ),
          },
        };
      }
      const errors: Record<string, string> = {
        '400': 'Invalid input',
        '401': 'Unauthenticated/expired/revoked',
        '403': 'Forbidden or ownership/CSRF denied',
        '404': 'Not found',
        '409': 'State/unique/idempotency conflict',
        '429': 'Rate limited',
        '503': 'Dependency unavailable',
      };
      for (const [code, description] of Object.entries(errors)) {
        op.responses[code] ??= {
          description,
          content: {
            'application/json': {
              schema: object(
                {
                  success: { type: 'boolean', enum: [false] },
                  error: object({ code: string, message: string }, [
                    'code',
                    'message',
                  ]),
                  meta: object({ correlationId: string }, ['correlationId']),
                },
                ['success', 'error', 'meta'],
              ),
            },
          },
        };
      }
    }
  }
}

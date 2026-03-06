# RxDB v16 Schema Validation Guide — WTFPOS

**Source:** `rxdb@16.21.1` — `plugins/dev-mode/check-schema.js` + `error-messages.js` + `rx-schema.js`
**Validator:** `wrappedValidateIsMyJsonValidStorage` (active in dev mode only)
**Storage:** `getRxStorageDexie()` (IndexedDB via Dexie.js)

All SC* codes and DXE* codes below are verified directly from the RxDB source files
in `node_modules/rxdb/dist/esm/plugins/dev-mode/`.

---

## How Validation Works — Two Distinct Stages

### Stage 1: Schema Check — runs at `addCollections()` (boot time)

`checkSchema()` is called by the dev-mode plugin when your schema is registered.
Throws immediately — your app will not start.

Only active when `RxDBDevModePlugin` is loaded:
```ts
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
if (dev) addRxPlugin(RxDBDevModePlugin);
```

### Stage 2: Document Validation — runs at every write (insert / patch / modify)

`wrappedValidateIsMyJsonValidStorage` wraps Dexie with `is-my-json-valid`.
Every document is validated against the schema on `insert()`, `upsert()`, and
before `incrementalPatch()`/`incrementalModify()` commits.

Only active when `wrappedValidateIsMyJsonValidStorage` replaces the raw storage:
```ts
storage: dev
    ? wrappedValidateIsMyJsonValidStorage({ storage: getRxStorageDexie() })
    : getRxStorageDexie()
```

**In production (plain Dexie), Stage 2 does NOT run.**
Bad documents are written silently and only cause problems at query time.
Write schemas correctly — both stages depend on it.

---

## What `fillWithDefaultSettings()` Adds Automatically

Before any validation runs, RxDB enriches your schema internally. Do NOT define these
yourself — it will cause the errors noted below.

| What is added | To `properties` | To `required` |
|---|---|---|
| `_rev` (revision string) | yes | yes |
| `_deleted` (soft-delete boolean) | yes | yes |
| `_meta` (internal lwt timestamp object) | yes | yes |
| `_attachments` (attachment object) | yes | yes |
| `additionalProperties: false` | set on top-level schema | — |
| `keyCompression: false` | set if not already present | — |

Every index you define also gets:
- `_deleted` prepended automatically → `['locationId','status']` becomes `['_deleted','locationId','status','id']`
- `primaryKey` appended if not already present → ensures deterministic sort order
- `['_meta.lwt', primaryKey]` index added automatically for change tracking

---

## Stage 1 Error Codes — Schema Check

> All codes below are from `check-schema.js:checkSchema()` + `validateFieldsDeep()` + `checkPrimaryKey()`.

---

### Field Name Validation

#### SC1 — Field name does not match the allowed regex
**Message:** `"fieldnames do not match the regex"`

All field names must match: `^[a-zA-Z](?:[[a-zA-Z0-9_]*]?[a-zA-Z0-9])?$`

Allowed exceptions: `_id` (as primaryKey), `_deleted` (auto-managed).

```ts
// WRONG — SC1
properties: { 'my-field': { type: 'string' } }   // hyphens not allowed
properties: { '1count': { type: 'string' } }       // cannot start with number
properties: { 'a': { type: 'string' } }            // single char: OK (matches regex)

// CORRECT
properties: { myField: { type: 'string' } }
properties: { count1: { type: 'string' } }
```

#### SC8 — Top-level field name starts with underscore `_`
**Message:** `"first level-fields cannot start with underscore _"`

Only `_id` (as primary key) and `_deleted` (reserved by RxDB) may start with `_`.
All other underscore-prefixed top-level fields are rejected.

```ts
// WRONG — SC8
properties: { _myField: { type: 'string' } }

// CORRECT
properties: { myField: { type: 'string' } }
```

#### SC17 — Top-level field name conflicts with RxDocument properties
**Message:** `"top-level fieldname is not allowed"`

RxDB adds method names from `RxDocument` prototype to every document. Using any
of those names as a field name in your schema silently breaks those methods.
The dev-mode plugin explicitly rejects them.

Examples of reserved property names: `deleted`, `synced`, `get`, `get$`, `set`,
`remove`, `populate`, `toJSON`, `toMutableJSON`, `collection`, `primaryPath`.

```ts
// WRONG — SC17
properties: { deleted: { type: 'boolean' } }    // conflicts with doc.deleted
properties: { collection: { type: 'string' } }  // conflicts with doc.collection

// CORRECT — use a different name
properties: { isDeleted: { type: 'boolean' } }
```

#### SC23 — Field name `properties` is not allowed
**Message:** `"fieldname is not allowed"`

The string `"properties"` is structurally reserved in JSON Schema and cannot be
used as a field name at any level.

---

### `properties` Key

#### SC29 — Schema object is missing the `properties` key
**Message:** `"missing object key 'properties'"`

```ts
// WRONG — SC29
export const mySchema = { version: 0, primaryKey: 'id', type: 'object' };

// CORRECT
export const mySchema = {
    version: 0, primaryKey: 'id', type: 'object',
    properties: { id: { type: 'string', maxLength: 100 } }
};
```

---

### `version` Validation

#### SC11 — Version is not a valid non-negative integer
**Message:** `"schema needs a number >=0 as version"`

```ts
version: 0      // ✅ first version
version: 1      // ✅ after migration
version: -1     // ❌ SC11 — negative
version: 1.5    // ❌ SC11 — not integer
version: '1'    // ❌ SC11 — not a number
```

---

### `primaryKey` Validation

#### SC30 — `primaryKey` is not defined
**Message:** `"primaryKey is required"`

```ts
// WRONG — SC30
export const mySchema = { version: 0, type: 'object', properties: { ... } };

// CORRECT
export const mySchema = { version: 0, primaryKey: 'id', type: 'object', properties: { ... } };
```

#### SC33 — `primaryKey` field is not a property in the schema
**Message:** `"used primary key is not a property in the schema"`

```ts
// WRONG — SC33
primaryKey: 'id',
properties: { name: { type: 'string' } }   // 'id' not defined in properties

// CORRECT
primaryKey: 'id',
properties: { id: { type: 'string', maxLength: 100 }, name: { type: 'string' } }
```

#### SC32 — Primary key field must be type `string`, `number`, or `integer`
**Message:** `"primary field must have the type string/number/integer"`

```ts
// WRONG — SC32
properties: { id: { type: 'boolean' } }   // cannot be boolean
properties: { id: { type: 'object' } }    // cannot be object

// CORRECT
properties: { id: { type: 'string', maxLength: 100 } }
```

#### SC39 — Primary key field must have `maxLength` — ALWAYS ENFORCED (not dev-only)
**Message:** `"The primary key must have the maxLength attribute set"`

This check runs in **both dev and production** via `new RxSchema(jsonSchema)`.
Missing `maxLength` on the primary key will crash even without the dev-mode plugin.

Dexie uses `maxLength` to pre-allocate IndexedDB key buffer sizes.

```ts
// WRONG — SC39 (crashes in production too)
properties: { id: { type: 'string' } }

// CORRECT
properties: { id: { type: 'string', maxLength: 100 } }
```

#### SC41 — `maxLength` must be a real finite number
**Message:** `"minimum, maximum and maxLength values for indexes must be real numbers, not Infinity or -Infinity"`

```ts
// WRONG — SC41
properties: { id: { type: 'string', maxLength: Infinity } }

// CORRECT
properties: { id: { type: 'string', maxLength: 100 } }
```

#### SC13 — `primaryKey` must NOT appear in the `indexes` array
**Message:** `"primary is always index, do not declare it as index"`

The primary key is always indexed automatically. Declaring it again is an error.

```ts
// WRONG — SC13
primaryKey: 'id',
indexes: ['id', 'locationId']   // 'id' is already the primary index

// CORRECT
indexes: ['locationId']   // never put the primary key here
```

#### SC14 — Primary key field must NOT have `unique: true`
**Message:** `"primary is always unique, do not declare it as index"`

```ts
// WRONG — SC14
properties: { id: { type: 'string', maxLength: 100, unique: true } }

// CORRECT
properties: { id: { type: 'string', maxLength: 100 } }
```

#### SC15 — Primary key cannot be in the `encrypted` array
**Message:** `"primary cannot be encrypted"`

#### SC16 — Primary key field type must be exactly `'string'`
**Message:** `"primary must have type: string"`

Note: SC32 allows `number`/`integer` for compound primary keys, but SC16 applies
to simple string primary keys (which is all WTFPOS uses). Keep primaries as `type: 'string'`.

---

### Reserved Internal Field Names

#### SC10 — Cannot define `_rev` in schema
**Message:** `"schema defines ._rev, this will be done automatically"`

`_rev`, `_deleted`, `_meta`, and `_attachments` are added to `properties` automatically
by `fillWithDefaultSettings()`. Defining them yourself overwrites RxDB internals.

```ts
// WRONG — SC10
properties: { _rev: { type: 'string' } }   // auto-added by RxDB
```

---

### Field-level Rules

#### SC2 — Keyword `item` (not `items`) used on a non-array field
**Message:** `"name 'item' reserved for array-fields"`

JSON Schema uses `items` (plural) for arrays. The singular `item` is reserved and
may only appear in practice on actual array field types.

```ts
// WRONG — SC2
properties: { tags: { type: 'string', item: { type: 'string' } } }

// CORRECT
properties: { tags: { type: 'array', items: { type: 'string' } } }
```

#### SC7 — `default` keyword cannot be used in nested schema properties
**Message:** `"default-values can only be defined at top-level"`

RxDB does not support JSON Schema `default` in nested schemas.
Note: the error message says "top-level" but the actual check is the inverse —
`default` in nested paths throws, while top-level `default` is silently read
by `rxSchema.defaultValues` (but is not enforced on inserts by `is-my-json-valid`).

**Safest rule: never use `default` anywhere in schemas. Always set values explicitly at `insert()` time.**

```ts
// WRONG — SC7 (nested)
properties: {
    meta: {
        type: 'object',
        properties: {
            count: { type: 'number', default: 0 }   // throws SC7
        }
    }
}

// CORRECT — set defaults explicitly in your insert() call
await db.orders.insert({ ..., meta: { count: 0 } });
```

#### SC24 — `required` must be an array on the object, not `true` on a field
**Message:** `"required fields must be set via array"`

```ts
// WRONG — SC24 (old JSON Schema draft-03 style)
properties: {
    name: { type: 'string', required: true }   // boolean required not allowed
}

// CORRECT — declare required at the schema object level
required: ['name', 'id', ...]
```

#### SC26 — Cannot use `index: true` on individual properties
**Message:** `"indexes needs to be specified at collection schema level"`

The shorthand `index: true` on a property is a legacy API. Use the top-level `indexes` array.

```ts
// WRONG — SC26
properties: { locationId: { type: 'string', maxLength: 100, index: true } }

// CORRECT
properties: { locationId: { type: 'string', maxLength: 100 } },
indexes: ['locationId']
```

#### SC40 — `$ref` is not allowed anywhere in schemas
**Message:** `"$ref fields in the schema are not allowed"`

RxDB cannot resolve `$ref` references at runtime (would require HTTP at runtime).
Resolve all `$ref` at build time before registering schemas.

```ts
// WRONG — SC40
properties: { address: { $ref: '#/definitions/Address' } }
```

---

### `indexes` Array Validation

#### SC18 — `indexes` must be an array
**Message:** `"indexes must be an array"`

#### SC19 — Each index entry must be a string or array of strings
**Message:** `"indexes must contain strings or arrays of strings"`

#### SC20 — Compound index array entries must all be strings
**Message:** `"indexes.array must contain strings"`

```ts
// WRONG — SC20
indexes: [['locationId', 1]]   // 1 is not a string

// CORRECT
indexes: [['locationId', 'status']]
```

#### SC21 — Indexed field path does not exist in schema `properties`
**Message:** `"given index is not defined in schema"`

```ts
// WRONG — SC21
properties: { id: { ... }, name: { ... } },
indexes: ['status']   // 'status' not in properties

// CORRECT
properties: { id: { ... }, status: { type: 'string', maxLength: 50 } },
indexes: ['status']
```

#### SC22 — Indexed field type is not scalar (`string`, `number`, `integer`, `boolean`)
**Message:** `"given indexKey is not type:string"`

Objects and arrays cannot be indexed. This is a second pass check after the switch block.

```ts
// WRONG — SC22
properties: { meta: { type: 'object' } },
indexes: ['meta']   // objects cannot be indexed

properties: { tags: { type: 'array' } },
indexes: ['tags']   // arrays cannot be indexed
```

#### SC34 — String field in index is missing `maxLength` ← most common index error
**Message:** `"Fields of type string that are used in an index, must have set the maxLength attribute in the schema"`

Any field with `type: 'string'` (simple type, not union) that appears in ANY index
(simple or compound) must declare `maxLength`. RxDB needs this to craft padded
index strings for correct sort order.

```ts
// WRONG — SC34
properties: { locationId: { type: 'string' } },   // no maxLength
indexes: ['locationId']                             // → SC34 at boot

// CORRECT
properties: { locationId: { type: 'string', maxLength: 100 } },
indexes: ['locationId']
```

#### SC35 — Number/integer field in index is missing `multipleOf`
**Message:** `"Fields of type number/integer that are used in an index, must have set the multipleOf attribute in the schema"`

```ts
// WRONG — SC35
properties: { price: { type: 'number' } },
indexes: ['price']

// CORRECT
properties: { price: { type: 'number', minimum: 0, maximum: 9999999, multipleOf: 0.01 } },
indexes: ['price']
```

#### SC37 — Number/integer field in index is missing `minimum` or `maximum`
**Message:** `"Fields of type number that are used in an index, must have set the minimum and maximum attribute in the schema"`

```ts
// WRONG — SC37 (has multipleOf but no min/max)
properties: { score: { type: 'number', multipleOf: 1 } },
indexes: ['score']

// CORRECT — all three required for number indexes
properties: { score: { type: 'number', minimum: 0, maximum: 100, multipleOf: 1 } },
indexes: ['score']
```

#### SC36 — Field type cannot be used as an index
**Message:** `"A field of this type cannot be used as index"`

Thrown when the field type in the switch block does not match `string`, `number`,
`integer`, or `boolean`. This is the primary error for nullable union types in indexes.

```ts
// WRONG — SC36 (nullable union hits the switch `default` case)
properties: { tableId: { type: ['string', 'null'], maxLength: 100 } },
indexes: ['tableId']   // ['string','null'] is not type 'string' → SC36

// CORRECT — remove nullable fields from indexes entirely
properties: { tableId: { type: ['string', 'null'], maxLength: 100 } },
// no index — filter reactively in $derived instead

// CORRECT alternative — make it non-nullable with a sentinel value
properties: { tableId: { type: 'string', maxLength: 100 } },
// store empty string '' for takeout orders, never null
indexes: ['tableId']
```

**Do NOT use `type: ['X', 'null']` unions on any indexed field. Either remove the
field from indexes or guarantee it is always non-null.**

#### SC38 — Boolean field in index must be in `required` array
**Message:** `"Fields of type boolean that are used in an index, must be required in the schema"`

Boolean fields can be indexed (Dexie stores them as 0/1), but RxDB requires them
to be in `required` to guarantee the value is never `undefined`.

```ts
// WRONG — SC38
properties: { depleted: { type: 'boolean' } },
required: ['id', 'stockItemId'],   // depleted not in required
indexes: ['depleted']              // → SC38

// CORRECT
properties: { depleted: { type: 'boolean' } },
required: ['id', 'stockItemId', 'depleted'],   // depleted required
indexes: ['depleted']                           // → OK
```

**Note:** Boolean index fields only support equality queries (`$eq: true/false`).
Range queries and sort on booleans do not work correctly with Dexie.

#### SC41 — `maxLength`, `minimum`, or `maximum` cannot be `Infinity` or `-Infinity`
**Message:** `"minimum, maximum and maxLength values for indexes must be real numbers, not Infinity or -Infinity"`

---

### `ref` Field Validation

#### SC3 — `ref` on an array field: `items.type` must be `'string'`
**Message:** `"fieldname has a ref-array but items-type is not string"`

#### SC4 — `ref` field type must be `string`, `['string','null']`, or `array<string>`
**Message:** `"fieldname has a ref but is not type string, [string,null] or array<string>"`

---

### Encryption Field Validation

#### SC28 — Encrypted field path does not exist in schema
**Message:** `"encrypted fields is not defined in the schema"`

```ts
// WRONG — SC28
encrypted: ['secretField'],
properties: { id: { type: 'string', maxLength: 100 } }   // secretField not in properties
```

---

## Dexie Storage Error Codes

These come from `plugins/storage-dexie/` and apply specifically to `getRxStorageDexie()`.

#### DXE1 — Non-required index fields are not possible with Dexie.js storage
**Message:** `"non-required index fields are not possible with the dexie.js RxStorage"`

Every field that appears in any index (simple or compound) **must** also appear
in the `required` array. Dexie cannot create an index on a field that may be absent.

```ts
// WRONG — DXE1
properties: { locationId: { type: 'string', maxLength: 100 } },
required: ['id'],          // locationId not in required
indexes: ['locationId']    // → DXE1 from Dexie storage layer

// CORRECT
required: ['id', 'locationId'],
indexes: ['locationId']
```

**This applies to compound indexes too — every field in the compound must be required.**

---

## Migration Error Codes

Triggered by `migrationStrategies` configuration in `db.addCollections()`.

| Code | Message | Cause |
|---|---|---|
| `COL11` | migrationStrategies must be an object | Passed array or non-object |
| `COL12` | A migrationStrategy is missing or too much | Strategy count doesn't match version. Version 2 needs exactly keys `{1:fn, 2:fn}` |
| `COL13` | migrationStrategy must be a function | A strategy value is not a function |
| `DM4` | Migration errored | The migration function threw or returned a malformed document |
| `DM2` | migration of document failed — final document does not match final schema | Migrated doc fails validation against new schema |

```ts
// Schema at version 2 requires strategies for BOTH 1 and 2
// WRONG — COL12 (missing step 2)
migrationStrategies: { 1: (doc) => doc }

// CORRECT
migrationStrategies: {
    1: (doc) => doc,    // v0 → v1
    2: (doc) => doc     // v1 → v2
}
```

#### DB6 — Schema hash mismatch with existing stored collection
**Message:** `"another instance created this collection with a different schema"`

Thrown when the schema hash stored internally does not match the current schema.
Happens when you change a schema without bumping `version`. Always bump the version
when changing any schema property, even if the data shape is unchanged.

---

## Stage 2 — Document Write Validation (`wrappedValidateIsMyJsonValidStorage`)

Every document write (insert / patch / modify) is validated using `is-my-json-valid`
against the *enriched* internal schema (with `_rev`, `_deleted`, `_meta`, `_attachments`
added). Failures surface as:

| Status | Code | Meaning |
|---|---|---|
| `422` | `VD2` | `"object does not match schema"` — document fails JSON Schema validation |
| `409` | `CONFLICT` | Write conflict on the same document revision |

```ts
// What is-my-json-valid enforces at write time:
// - required fields must be present
// - type must match declared type
// - maxLength must not be exceeded on strings
// - minimum / maximum must not be violated on numbers
// - enum values must be in the allowed list
// - nested items.properties are validated recursively
```

### What `is-my-json-valid` enforces

| Rule | Enforced |
|---|---|
| `required` fields present | ✅ VD2 if missing |
| `type` matches declared type | ✅ VD2 if wrong type |
| `maxLength` not exceeded | ✅ VD2 if too long |
| `minLength` satisfied | ✅ VD2 if too short |
| `minimum` / `maximum` on numbers | ✅ VD2 if out of range |
| `enum` values | ✅ VD2 if not in list |
| `pattern` regex on strings | ✅ VD2 if no match |
| Nested `items.properties` on arrays | ✅ recursively validated |
| Unknown fields (not in `properties`) | Rejected — `additionalProperties: false` is set |

### `additionalProperties: false` is always active

`fillWithDefaultSettings()` sets `additionalProperties: false` on every schema.
Writing a field not declared in `properties` will fail VD2 in dev mode.

---

## DVM1 — Dev-Mode Requires a Schema Validator Storage
**Message:** `"When dev-mode is enabled, your storage must use one of the schema validators at the top level"`

If `RxDBDevModePlugin` is active but you use plain `getRxStorageDexie()` without
`wrappedValidateIsMyJsonValidStorage`, this warning fires. Document validation
(Stage 2) is skipped entirely.

```ts
// WRONG in dev — DVM1 warning
storage: getRxStorageDexie()

// CORRECT in dev
storage: dev
    ? wrappedValidateIsMyJsonValidStorage({ storage: getRxStorageDexie() })
    : getRxStorageDexie()
```

---

## Complete Error Code Reference — Schema Related

| Code | Stage | Trigger |
|---|---|---|
| SC1 | Schema check | Field name fails regex `^[a-zA-Z]...$` |
| SC2 | Schema check | Keyword `item` used on non-array field |
| SC3 | Schema check | `ref` + array field: `items.type` not string |
| SC4 | Schema check | `ref` field type is not string/null/array<string> |
| SC7 | Schema check | `default` keyword in a nested schema property |
| SC8 | Schema check | Top-level field name starts with `_` |
| SC10 | Schema check | `_rev` manually defined in schema |
| SC11 | Schema check | `version` is not a non-negative integer |
| SC13 | Schema check | primaryKey field listed in `indexes` |
| SC14 | Schema check | `unique: true` on primary key field |
| SC15 | Schema check | primaryKey listed in `encrypted` |
| SC16 | Schema check | primaryKey field type is not `'string'` |
| SC17 | Schema check | Top-level field name conflicts with RxDocument method |
| SC18 | Schema check | `indexes` is not an array |
| SC19 | Schema check | Index entry is not string or string[] |
| SC20 | Schema check | Compound index entry is not a string |
| SC21 | Schema check | Indexed field path not found in schema properties |
| SC22 | Schema check | Indexed field type is not string/number/integer/boolean |
| SC23 | Schema check | Field name `properties` is reserved |
| SC24 | Schema check | `required: true` used on a field instead of array |
| SC26 | Schema check | `index: true` on individual property (use top-level `indexes`) |
| SC28 | Schema check | Encrypted field path not in schema properties |
| SC29 | Schema check | Schema missing `properties` key |
| SC30 | Schema check | `primaryKey` not defined |
| SC32 | Schema check | primaryKey field type not string/number/integer |
| SC33 | Schema check | primaryKey field not defined in `properties` |
| SC34 | Schema check | String field in index missing `maxLength` |
| SC35 | Schema check | Number/integer field in index missing `multipleOf` |
| SC36 | Schema check | Field type cannot be indexed (includes nullable unions `['string','null']`) |
| SC37 | Schema check | Number/integer field in index missing `minimum` or `maximum` |
| SC38 | Schema check | Boolean field in index not in `required` |
| SC39 | Schema check + Production | primaryKey field missing `maxLength` — **fires in production too** |
| SC40 | Schema check | `$ref` used in schema |
| SC41 | Schema check | `maxLength`/`minimum`/`maximum` is Infinity |
| DXE1 | Schema check | Indexed field not in `required` (Dexie storage constraint) |
| COL11 | `addCollections` | `migrationStrategies` is not an object |
| COL12 | `addCollections` | Wrong number of migration strategy functions for the version |
| COL13 | `addCollections` | A migration strategy value is not a function |
| DB6 | `addCollections` | Schema hash mismatch with stored schema (forgot to bump version) |
| DM4 | Migration run | Migration function threw an error |
| DM2 | Migration run | Migrated document fails new schema validation |
| DVM1 | DB init | Dev-mode active but storage has no schema validator wrapper |
| VD2 | Document write | Document fails `is-my-json-valid` validation |
| COL20 | Document write | Storage write error (wraps VD2 status 422 and CONFLICT 409) |

---

## Current WTFPOS Schema Status

Verified against all schemas in `src/lib/db/schemas.ts`:

| Schema | Version | SC39 (PK maxLength) | SC34 (idx str maxLength) | SC38 (bool idx required) | DXE1 (idx fields required) | Issues |
|---|---|---|---|---|---|---|
| `tableSchema` | 2 | ✅ `id` maxLength:100 | ✅ locationId/status/updatedAt have maxLength | n/a | ✅ all in required | None |
| `orderSchema` | 4 | ✅ | ✅ locationId/status/createdAt/updatedAt | n/a | ✅ | None — subBills, items, payments all have nested required |
| `menuItemSchema` | 1 | ✅ | ✅ updatedAt maxLength:30 | n/a | ✅ | `name`,`category` no maxLength — OK (not indexed) |
| `stockItemSchema` | 2 | ✅ | ✅ | n/a | ✅ | None |
| `deliverySchema` | 3 | ✅ | ✅ receivedAt/updatedAt maxLength:30 | ✅ depleted in required | ✅ | None |
| `wasteSchema` | 3 | ✅ | ✅ loggedAt/updatedAt maxLength:30 | n/a | ✅ | None |
| `deductionSchema` | 2 | ✅ | ✅ orderId/updatedAt | n/a | ✅ | `tableId`,`timestamp` no maxLength — OK (not indexed) |
| `expenseSchema` | 3 | ✅ | ✅ createdAt/updatedAt maxLength:30 | n/a | ✅ | None |
| `adjustmentSchema` | 3 | ✅ | ✅ loggedAt/updatedAt maxLength:30 | n/a | ✅ | None |
| `stockCountSchema` | 2 | ✅ (primaryKey: `stockItemId`) | ✅ updatedAt maxLength:30 | n/a | ✅ | None |
| `kdsTicketSchema` | 3 | ✅ | ✅ orderId/updatedAt | n/a | ✅ | None — items have nested required |
| `kdsHistorySchema` | 2 | ✅ | ✅ updatedAt maxLength:30 | n/a | ✅ | None — items have nested required |
| `deviceSchema` | 1 | ✅ | ✅ updatedAt maxLength:30 | n/a | ✅ | Other strings no maxLength — OK (not indexed) |
| `xReadSchema` | 1 | ✅ | ✅ updatedAt maxLength:30 | n/a | ✅ | None |
| `utilityReadingSchema` | 1 | ✅ | ✅ updatedAt maxLength:30 | n/a | ✅ | None |

**All known schema gaps have been resolved.** SubBills, order items, payments, and KDS items all have proper nested `items` schemas with `required` arrays.

---

## Replication Schema Preparation

When replication is enabled (LAN sync or cloud sync to Neon PostgreSQL), schemas must satisfy additional requirements beyond local-only validation. These rules apply to **every collection that will replicate** (all collections except `session` and runtime-only state).

See `RXDB_REPLICATION_GUIDE.md` for the full replication architecture.

---

### REP1 — Every replicated schema MUST have an `updatedAt` field

RxDB's replication protocol is checkpoint-based. The pull handler asks: "give me all documents changed after checkpoint X." Without `updatedAt`, the server cannot answer this query.

```ts
// REQUIRED on every replicated schema
properties: {
    // ... existing fields ...
    updatedAt: { type: 'string', maxLength: 30 }
},
required: [..., 'updatedAt'],
indexes: [..., 'updatedAt']
```

**Why `maxLength: 30`?** ISO 8601 timestamps (`2026-03-06T14:30:00.000Z`) are 24 characters. 30 gives buffer for timezone variants.

**Why indexed?** The pull query sorts and filters by `updatedAt` to find changes since the last checkpoint. Without the index, every pull does a full collection scan.

**Why required?** Dexie demands all indexed fields be required (DXE1). Also, a document without `updatedAt` would never appear in any pull result — it becomes invisible to replication.

#### Migration when adding `updatedAt` to an existing schema

Every existing document needs a backfilled `updatedAt`. Use the best available timestamp:

```ts
// Migration strategy for adding updatedAt
(oldDoc: any) => {
    oldDoc.updatedAt = oldDoc.updatedAt
        || oldDoc.createdAt      // orders, expenses
        || oldDoc.receivedAt     // deliveries
        || oldDoc.loggedAt       // waste, adjustments
        || oldDoc.lastSeenAt     // devices
        || oldDoc.timestamp      // deductions, x_reads
        || oldDoc.bumpedAt       // kds_history
        || oldDoc.date           // utility_readings
        || new Date().toISOString();  // fallback
    return oldDoc;
}
```

#### Every write MUST set `updatedAt`

This is the single most common replication bug. If you forget `updatedAt` on a write, that change will never be pulled by other devices.

```ts
// Insert — always include updatedAt
await db.orders.insert({
    ...orderData,
    updatedAt: new Date().toISOString()
});

// incrementalPatch — always include updatedAt alongside your changes
await doc.incrementalPatch({
    status: 'paid',
    updatedAt: new Date().toISOString()
});

// incrementalModify — always set updatedAt in the callback
await doc.incrementalModify((d) => {
    d.items = [...d.items, newItem];
    d.updatedAt = new Date().toISOString();
    return d;
});

// WRONG — change is invisible to replication
await doc.incrementalPatch({ status: 'paid' }); // missing updatedAt
```

---

### REP2 — Soft deletes: `_deleted` is managed by RxDB — do NOT define it

When `doc.remove()` is called, RxDB sets `_deleted: true` internally. The document remains in storage and replicates as a deletion event. You do NOT need to add `_deleted` to your schema — RxDB's `fillWithDefaultSettings()` handles this (see SC10 section above).

**Key implications for replication:**

- Deleted documents are still in IndexedDB (just marked `_deleted: true`)
- The replication pull MUST include deleted documents (RxDB handles this)
- Your Postgres tables (Phase 2) need a `deleted BOOLEAN DEFAULT false` column
- Never hard-delete rows in Postgres — mark `deleted = true` instead
- Never call `indexedDB.deleteDatabase()` if there are unreplicated changes

```ts
// CORRECT — RxDB handles _deleted internally
await orderDoc.remove();
// Result: order._deleted = true, replication pushes deletion to server

// WRONG — bypasses RxDB's change tracking
// indexedDB.deleteDatabase('wtfpos_db');  // unreplicated changes are lost forever
```

#### Cleanup of old deleted documents

Deleted documents accumulate. Use RxDB's `cleanup()` method during maintenance windows:

```ts
// Only run after ALL devices have synced past the deletion checkpoint
// Safe window: after close (10 PM+), all tablets confirmed synced
await db.orders.cleanup(0); // removes all _deleted docs from IndexedDB
```

---

### REP3 — Conflict-prone fields need special schema design

When two devices modify the same document simultaneously, RxDB's conflict handler must merge them. Schema design affects how cleanly conflicts resolve.

**Array fields (items, payments) are the hardest to merge.** Each array element MUST have a unique `id` field so the conflict handler can match elements across forks:

```ts
// CORRECT — each item has a unique id for conflict merging
items: {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'string' },        // unique per item — used by conflict handler
            menuItemName: { type: 'string' },
            quantity: { type: 'number' },
            status: { type: 'string' }      // 'pending' | 'sent' | 'done'
        },
        required: ['id', 'menuItemName', 'quantity', 'status']
    }
}

// WRONG — no id means conflict handler can't match items across forks
items: {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            menuItemName: { type: 'string' },
            quantity: { type: 'number' }
        }
    }
}
```

**Status fields should use a progression model.** When two devices set different statuses, the conflict handler should pick the "furthest along" status:

```
Table status progression:  available → reserved → occupied → warning → critical → cleaning → available
Order status progression:  open → paid → closed → cancelled
KDS item progression:      pending → preparing → done
```

The conflict handler uses these progressions to resolve: if master says `preparing` and fork says `done`, keep `done`.

---

### REP4 — Primary keys must be globally unique across all devices

With replication, two devices might insert documents simultaneously. If both generate the same primary key, one insert silently overwrites the other.

**Current approach (correct):** `nanoid()` generates collision-resistant IDs. Keep using it.

```ts
// CORRECT — nanoid has negligible collision probability
import { nanoid } from 'nanoid';
const orderId = nanoid(); // e.g., 'V1StGXR8_Z5jdHi6B-myT'

// WRONG — sequential IDs collide across devices
let counter = 0;
const orderId = `order-${counter++}`; // two devices both create 'order-0'
```

**For collections with non-nanoid primary keys** (like `stockCountSchema` which uses `stockItemId` as its primary key), ensure the ID is deterministic and shared across devices. `stockItemId` works because stock items are seeded identically on all devices.

---

### REP5 — Compound indexes for replication pull queries

The replication pull endpoint queries: "give me documents where `updatedAt > checkpoint.updatedAt`, sorted by `updatedAt` then `id`." This query benefits from a compound index:

```ts
// Add to schemas that will have high pull traffic
indexes: [
    // ... existing indexes ...
    'updatedAt',                    // simple index for pull queries
    ['updatedAt', 'id']             // compound for tie-breaking (optional, improves perf)
]
```

**Note:** The `id` field is the primary key and is auto-appended to all indexes by `fillWithDefaultSettings()`. So a simple `'updatedAt'` index internally becomes `['_deleted', 'updatedAt', 'id']` — which already covers the pull query. The explicit compound index is only needed if you see slow pull performance with large collections.

---

### REP6 — Schema version coordination across devices

In a multi-device setup, different tablets may be running different schema versions during a rollout. RxDB handles this via migrations, but the replication layer adds constraints:

**Rule: Always update the server first, then clients.**

```
Rollout order:
1. Main tablet (server) → runs migration on its local RxDB
2. Client tablets one at a time → each runs migration locally
3. Replication resumes between migrated devices

NEVER let a client with schema v(N+1) push to a server with schema v(N).
The server won't have the new fields and may reject or corrupt data.
```

**Version history — `updatedAt` added (REP1 applied):**

| Schema | Version | `updatedAt` migration | Status |
|---|---|---|---|
| `tableSchema` | 2 | v1→v2: backfill from `sessionStartedAt` | Done |
| `orderSchema` | 4 | v3→v4: backfill from `createdAt` | Done |
| `menuItemSchema` | 1 | v0→v1: backfill `new Date().toISOString()` | Done |
| `stockItemSchema` | 2 | v1→v2: backfill `new Date().toISOString()` | Done |
| `deliverySchema` | 3 | v2→v3: backfill from `receivedAt` | Done |
| `wasteSchema` | 3 | v2→v3: backfill from `loggedAt` | Done |
| `deductionSchema` | 2 | v1→v2: backfill from `timestamp` | Done |
| `expenseSchema` | 3 | v2→v3: backfill from `createdAt` | Done |
| `adjustmentSchema` | 3 | v2→v3: backfill from `loggedAt` | Done |
| `stockCountSchema` | 2 | v1→v2: backfill `new Date().toISOString()` | Done |
| `kdsTicketSchema` | 3 | v2→v3: backfill from `createdAt` | Done |
| `kdsHistorySchema` | 2 | v1→v2: backfill from `bumpedAt` | Done |
| `deviceSchema` | 1 | v0→v1: backfill from `lastSeenAt` | Done |
| `xReadSchema` | 1 | v0→v1: backfill from `timestamp` | Done |
| `utilityReadingSchema` | 1 | v0→v1: backfill from `date` | Done |

---

### REP7 — Phase 2 (Neon PostgreSQL) schema parity

When replicating to Neon, your RxDB schemas and Postgres tables must stay in sync. Every schema change requires BOTH:

1. RxDB schema version bump + migration (local)
2. Drizzle/SQL migration for Neon (cloud)

**Field name mapping:** RxDB uses camelCase, Postgres uses snake_case.

```
RxDB property       → Postgres column
─────────────────────────────────────
locationId           → location_id
createdAt            → created_at
updatedAt            → updated_at
stockItemId          → stock_item_id
menuItemId           → menu_item_id
billPrinted          → bill_printed
sessionStartedAt     → session_started_at
elapsedSeconds       → elapsed_seconds
```

**Array/object fields in RxDB → JSONB columns in Postgres:**

```
RxDB property       → Postgres type
─────────────────────────────────────
items (array)        → JSONB NOT NULL DEFAULT '[]'
payments (array)     → JSONB NOT NULL DEFAULT '[]'
subBills (array)     → JSONB NOT NULL DEFAULT '[]'
discountIds (array)  → JSONB NOT NULL DEFAULT '[]'
counted (object)     → JSONB NOT NULL DEFAULT '{}'
meats (array)        → JSONB NOT NULL DEFAULT '[]'
autoSides (array)    → JSONB NOT NULL DEFAULT '[]'
```

---

## Rules Checklist Before Adding or Modifying a Schema

```
□ version is a non-negative integer
□ primaryKey field exists in properties
□ primaryKey field has type: 'string'
□ primaryKey field has maxLength (required in production too — SC39)
□ primaryKey is in required[]
□ primaryKey is NOT listed in indexes[] (auto-indexed — SC13)
□ No field name starts with _ at top level (except _id as primaryKey — SC8)
□ No _rev, _deleted, _meta, _attachments in properties (auto-added — SC10)
□ No $ref anywhere in schema (SC40)
□ No index: true on individual properties (use indexes[] array — SC26)
□ No required: true on individual fields (use required: [] array — SC24)
□ No default in nested schemas (SC7)
□ No RxDocument method names as top-level fields (SC17)

For every field in indexes[]:
□ Field exists in properties (SC21)
□ Field is in required[] (DXE1)
□ If type 'string':   must have maxLength (SC34)
□ If type 'number':   must have multipleOf + minimum + maximum (SC35, SC37)
□ If type 'boolean':  must be in required[] (SC38)  [already covered by DXE1]
□ If type is nullable union ['string','null']: REMOVE from indexes (SC36)
□ If type is object/array: REMOVE from indexes (SC22 / SC36)

When bumping version:
□ Added migrationStrategy for the new version in db/index.ts (COL12)
□ All version numbers 1..N have a strategy function (COL12)
□ Strategy functions return a valid document matching the new schema (DM2)

For document inserts (enforced by wrappedValidateIsMyJsonValidStorage in dev):
□ All required fields are present
□ Field values match their declared type
□ String values do not exceed maxLength
□ Number values are within minimum/maximum
□ No fields outside of properties (additionalProperties: false)

Replication readiness (REP1–REP7):
□ `updatedAt` field exists: type 'string', maxLength 30 (REP1)
□ `updatedAt` is in required[] (REP1 + DXE1)
□ `updatedAt` is in indexes[] (REP1)
□ Migration backfills `updatedAt` from best available timestamp (REP1)
□ Every write (insert/patch/modify) sets updatedAt: new Date().toISOString() (REP1)
□ Array fields have unique `id` on each element for conflict merging (REP3)
□ Primary keys use nanoid() — no sequential IDs (REP4)
□ No _deleted in your schema — RxDB manages it automatically (REP2)
□ If adding to Neon: Postgres table has matching columns + updated_at + deleted (REP7)
□ If adding to Neon: camelCase → snake_case mapping documented (REP7)
□ If adding to Neon: array/object fields use JSONB columns (REP7)
```

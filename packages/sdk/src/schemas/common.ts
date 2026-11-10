import { Schema } from "effect";

/** Known fields plus unrecognized wire fields. Decoding and encoding preserve extensions. */
export const openStruct = <const Fields extends Schema.Struct.Fields>(fields: Fields) =>
  Schema.StructWithRest(Schema.Struct(fields), [Schema.Record(Schema.String, Schema.Unknown)]);

/** A field observed as absent or null in the client; this is not a server requiredness claim. */
export const optionalNullable = <S extends Schema.Constraint>(schema: S) =>
  Schema.optionalKey(Schema.NullOr(schema));

/** Frontend form DTOs can retain blank identifier fields before issuance. */
export const emptyOr = <S extends Schema.Constraint>(schema: S) => Schema.Union([schema, Schema.Literal("")]);

export const UnknownObject = Schema.Record(Schema.String, Schema.Unknown);
export type UnknownObject = typeof UnknownObject.Type;

/** Wire date text is retained verbatim. Formats vary across these APIs. */
export const WireDate = Schema.String;
export const NonNegativeInteger = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));
export const PositiveInteger = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));

export const StringValue = openStruct({ value: Schema.String });
export type StringValue = typeof StringValue.Type;

/** Exact criterion values are product-specific. No string/boolean/percent normalization occurs. */
export const Criterion = openStruct({
  reference: Schema.String,
  critereRef: Schema.optionalKey(Schema.String),
  stringValue: optionalNullable(Schema.String),
  booleanValue: optionalNullable(Schema.Boolean),
  integerValue: optionalNullable(Schema.Int),
  decimalValue: optionalNullable(Schema.Number),
  dateValue: optionalNullable(WireDate),
  nullValue: Schema.optionalKey(Schema.Boolean),
  parentRef: optionalNullable(Schema.String),
  orderIndex: optionalNullable(Schema.Int),
  valeurInString: optionalNullable(Schema.String),
});
export type Criterion = typeof Criterion.Type;

export const SearchCriterion = openStruct({
  reference: Schema.String,
  operation: Schema.optionalKey(Schema.String),
  valeur: Schema.Unknown,
});
export type SearchCriterion = typeof SearchCriterion.Type;

/** The frontend passes ordres through; its complete item shape is not established. */
export const SearchRequest = openStruct({
  criteres: Schema.Array(SearchCriterion),
  pageNumero: NonNegativeInteger,
  nbParPage: PositiveInteger,
  ordres: Schema.optionalKey(Schema.Array(Schema.Unknown)),
});
export type SearchRequest = typeof SearchRequest.Type;

/** Only use for endpoints whose callers consume content and totalElements. */
export const pageOf = <S extends Schema.Constraint>(item: S) => openStruct({
  content: Schema.Array(item),
  totalElements: NonNegativeInteger,
});

/** Transport unwraps this envelope; retained here for offline fixture and integration checks. */
export const envelopeOf = <S extends Schema.Constraint>(body: S) => openStruct({
  statusHttp: Schema.String,
  success: Schema.Boolean,
  codeMessage: Schema.optionalKey(Schema.Unknown),
  libelleMessage: Schema.optionalKey(Schema.Unknown),
  body,
});

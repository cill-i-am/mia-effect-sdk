/* Static syntax extraction only. Never executes the source bundle. */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const project = path.resolve(__dirname, '..');
const root = path.resolve(option('--out-dir', path.join(project, 'spec/frontend-metadata')));
const manifest = JSON.parse(fs.readFileSync(path.join(project, 'spec/source-manifest.json'), 'utf8'));
const main = manifest.sources.find(s => s.id === 'main');
const sourceFile = path.join(path.resolve(option('--source-dir', path.join(project, '.cache/sources'))), main.cachePath);
const bytes = fs.readFileSync(sourceFile);
if (crypto.createHash('sha256').update(bytes).digest('hex') !== main.sha256) throw new Error('Source hash mismatch');
const source = bytes.toString('utf8');
const index = JSON.parse(fs.readFileSync(path.join(path.resolve(option('--index-dir', path.join(project, '.cache/ast-index'))), 'main-declarations.json'), 'utf8'));
fs.mkdirSync(root, {recursive:true});
const declarations = index.declarations;
const top = declarations.filter(d=>d.topLevel);
const metadata = {...index.metadata,source:main.cachePath,sourceUrl:main.url,
  verification:'Static source extraction only. Application JavaScript was parsed, never executed; no business endpoint was called.',
  schemaScope:'Frontend defaults and validation rules, not authoritative server schemas, requiredness or access rights.'};
const errors=[];
const parsed=new Map();

function parse(d){
  const id=d.initializerStart+':'+d.initializerEnd;
  if(parsed.has(id))return parsed.get(id);
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  const code='('+raw+')';
  try{
    const node=acorn.parseExpressionAt(code,0,{ecmaVersion:'latest',sourceType:'module'});
    const value={node,code,offset:d.initializerStart-1};
    parsed.set(id,value);
    return value;
  }catch(e){errors.push({name:d.name,start:d.initializerStart,message:String(e)});return null;}
}
function text(n,c){return n?c.code.slice(n.start,n.end):null;}
function at(n,c){return n?c.offset+n.start:null;}
function key(n,c){return !n?null:n.type==='Identifier'?n.name:n.type==='Literal'?String(n.value):'['+text(n,c)+']';}
function propName(p,c){return p.computed?'['+text(p.key,c)+']':key(p.key,c);}
function walk(n,f){
  if(!n||typeof n!=='object')return;
  if(typeof n.type==='string')f(n);
  for(const [k,v] of Object.entries(n)){
    if(k==='start'||k==='end'||k==='loc')continue;
    if(Array.isArray(v))for(const e of v)walk(e,f);
    else if(v&&typeof v==='object')walk(v,f);
  }
}
function expr(n,c){
  if(!n)return {kind:'absent'};
  if(n.type==='Literal'){
    if(n.regex)return {kind:'regex',pattern:n.regex.pattern,flags:n.regex.flags};
    return {kind:'literal',value:typeof n.value==='bigint'?String(n.value):n.value};
  }
  if(n.type==='Identifier')return n.name==='undefined'?{kind:'undefined'}:{kind:'reference',name:n.name};
  if(n.type==='UnaryExpression'){
    const a=expr(n.argument,c);
    if(n.operator==='void')return {kind:'undefined',expression:text(n,c)};
    if(a.kind==='literal'){
      if(n.operator==='!')return {kind:'literal',value:!a.value,expression:text(n,c)};
      if(n.operator==='-'&&typeof a.value==='number')return {kind:'literal',value:-a.value,expression:text(n,c)};
      if(n.operator==='+'&&typeof a.value==='number')return {kind:'literal',value:+a.value,expression:text(n,c)};
    }
  }
  if(n.type==='ArrayExpression')return {kind:'array',items:n.elements.map(x=>expr(x,c))};
  if(n.type==='ObjectExpression')return {kind:'object',properties:n.properties.map(p=>p.type==='SpreadElement'?{spread:expr(p.argument,c)}:{name:propName(p,c),computed:p.computed,value:expr(p.value,c)})};
  if(n.type==='MemberExpression')return {kind:'reference',expression:text(n,c)};
  if(n.type==='TemplateLiteral')return {kind:'template',expression:text(n,c),staticParts:n.quasis.map(x=>x.value.cooked),expressions:n.expressions.map(x=>expr(x,c))};
  if(n.type==='ArrowFunctionExpression'||n.type==='FunctionExpression')return {kind:'function',parameters:n.params.map(p=>text(p,c)),expression:text(n,c)};
  return {kind:'expression',type:n.type,expression:text(n,c)};
}
function stringCode(v){return typeof v==='string'&&/^[A-Za-z0-9_][A-Za-z0-9_ .,%()\/-]*:[A-Z][A-Z0-9_]*$/.test(v);}
function valueCodes(n,c){const out=[];walk(n,a=>{if(a.type==='Literal'&&stringCode(a.value))out.push({value:a.value,sourceOffset:at(a,c)});});return out;}
function id(d){return d.name+'@'+d.initializerStart;}
function loc(d){return {id:id(d),name:d.name,topLevel:d.topLevel,scopeFunction:d.scopeFunction,sourceStart:d.initializerStart,sourceEnd:d.initializerEnd};}

const enums=[];
for(const d of top){
  if(/^TEMPLATE(?:\$|_|$)/.test(d.name))continue;
  if(!['ObjectExpression','CallExpression'].includes(d.initializerType))continue;
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  if(!/["'][A-Za-z0-9_][A-Za-z0-9_ .,%()\/-]*:[A-Z][A-Z0-9_]*["']/.test(raw))continue;
  if(raw.length>180000)continue;
  const c=parse(d);if(!c)continue;
  let node=c.node;
  if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&text(node.callee,c)==='Object.freeze'&&node.arguments[0]?.type==='ObjectExpression')node=node.arguments[0];
  if(node.type==='ObjectExpression'){
    const codes=valueCodes(node,c);if(!codes.length)continue;
    enums.push({...loc(d),kind:'code-bearing-object',categories:[...new Set(codes.map(v=>v.value.split(':').at(-1)))],codeValues:codes,value:expr(node,c),confidence:'Exact object initializer and code literals; semantic enum status inferred from usage/name.'});
  } else if(node.type==='CallExpression'){
    const fn=node.callee;
    if(!['ArrowFunctionExpression','FunctionExpression'].includes(fn.type))continue;
    const param=fn.params[0]?.name;
    if(!param)continue;
    const members=[];
    walk(fn.body,n=>{
      if(n.type==='AssignmentExpression'&&n.operator==='='&&n.left.type==='MemberExpression'&&n.left.object.type==='Identifier'&&n.left.object.name===param){
        const v=expr(n.right,c);if(v.kind==='literal')members.push({name:n.left.computed?key(n.left.property,c):n.left.property.name,value:v.value,sourceOffset:at(n,c)});
      }
    });
    const codes=members.filter(m=>stringCode(m.value));
    if(codes.length)enums.push({...loc(d),kind:'compiled-enum',categories:[...new Set(codes.map(v=>v.value.split(':').at(-1)))],members,confidence:'Exact literal assignments in the compiled enum initializer.'});
  }
}

const templates=[];
const templateNames=new Set();
for(const d of declarations){
  if(!/^TEMPLATE(?:\$|_|$)/.test(d.name)||['TEMPLATE_TOOLBAR','TEMPLATE_BASE_FORMATS'].includes(d.name))continue;
  const c=parse(d);if(!c)continue;
  templateNames.add(d.name);
  templates.push({...loc(d),value:expr(c.node,c),confidence:'Exact frontend initial-value template. Null, empty or default fields do not establish server optionality or valid minimum payloads.'});
}

function isYup(n,c,depth=0){
  if(!n||depth>40)return false;
  if(n.type==='Identifier')return n.name==='Yup';
  if(n.type==='MemberExpression')return isYup(n.object,c,depth+1);
  if(n.type==='CallExpression')return isYup(n.callee,c,depth+1);
  if(n.type==='ArrowFunctionExpression'||n.type==='FunctionExpression'){
    if(n.body.type!=='BlockStatement')return isYup(n.body,c,depth+1);
    return n.body.body.some(x=>x.type==='ReturnStatement'&&isYup(x.argument,c,depth+1));
  }
  if(n.type==='ConditionalExpression')return isYup(n.consequent,c,depth+1)||isYup(n.alternate,c,depth+1);
  if(n.type==='ObjectExpression')return n.properties.some(p=>p.type==='Property'&&isYup(p.value,c,depth+1));
  return false;
}
function chain(n,c){
  if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'){
    const base=chain(n.callee.object,c);
    return {...base,calls:[...base.calls,{method:n.callee.computed?key(n.callee.property,c):n.callee.property.name,args:n.arguments,offset:at(n,c)}]};
  }
  return {base:n,calls:[]};
}
function describeSchema(n,c){
  if(!n)return {kind:'absent'};
  if(n.type==='ArrowFunctionExpression'||n.type==='FunctionExpression'){
    const returns=n.body.type==='BlockStatement'?n.body.body.filter(x=>x.type==='ReturnStatement').map(x=>describeSchema(x.argument,c)):[describeSchema(n.body,c)];
    return {kind:'schema-factory',parameters:n.params.map(p=>text(p,c)),returns,expression:text(n,c)};
  }
  if(n.type==='ConditionalExpression')return {kind:'conditional-schema',condition:expr(n.test,c),then:describeSchema(n.consequent,c),otherwise:describeSchema(n.alternate,c)};
  if(n.type==='ObjectExpression')return {kind:'schema-field-map',fields:n.properties.map(p=>p.type==='SpreadElement'?{spread:expr(p.argument,c)}:{name:propName(p,c),schema:describeSchema(p.value,c)})};
  const ch=chain(n,c);
  if(!ch.calls.length)return {kind:'schema-reference-or-expression',...expr(n,c)};
  const rootType=ch.base.type==='Identifier'&&ch.base.name==='Yup'?ch.calls[0]?.method:null;
  const calls=ch.calls.map(call=>({method:call.method,arguments:call.args.map(a=>expr(a,c)),sourceOffset:call.offset}));
  const out={kind:'yup-chain',base:expr(ch.base,c),type:rootType,chain:calls,sourceExpression:text(n,c)};
  for(const call of ch.calls){
    if((call.method==='shape'||call.method==='object')&&call.args[0]?.type==='ObjectExpression'){
      out.fields=call.args[0].properties.map(p=>p.type==='SpreadElement'?{spread:expr(p.argument,c)}:{name:propName(p,c),schema:describeSchema(p.value,c)});
    }
    if(call.method==='of'&&call.args[0])out.items=describeSchema(call.args[0],c);
    if(call.method==='when'){
      const condition={arguments:call.args.map(a=>expr(a,c))};
      const settings=call.args.find(a=>a.type==='ObjectExpression');
      if(settings){
        condition.settings=settings.properties.map(p=>p.type==='SpreadElement'?{spread:expr(p.argument,c)}:{name:propName(p,c),value:['then','otherwise'].includes(propName(p,c))?describeSchema(p.value,c):expr(p.value,c)});
      }
      (out.conditionals??=[]).push(condition);
    }
  }
  const presence=ch.calls.filter(x=>['required','defined','optional','notRequired'].includes(x.method));
  if(presence.length)out.directPresenceRule=presence.at(-1).method;
  const nulls=ch.calls.filter(x=>['nullable','nonNullable'].includes(x.method));
  if(nulls.length)out.directNullRule=nulls.at(-1).method;
  if(ch.calls.some(x=>x.method==='when'))out.hasConditionalRules=true;
  return out;
}
const schemas=[];
const schemaNames=new Set();
for(const d of declarations){
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  if(!raw.includes('Yup.')&&!/schema/i.test(d.name))continue;
  if(raw.length>160000)continue;
  const c=parse(d);if(!c)continue;
  if(!isYup(c.node,c))continue;
  schemaNames.add(d.name);
  schemas.push({...loc(d),schema:describeSchema(c.node,c),confidence:'Exact client-side Yup expression; server acceptance and validation rules not established.'});
}

const associations=[];
const assocKeys=new Set();
const inlineFormSchemas=[];
const inlineSchemaKeys=new Set();
const owners=[...top.map(d=>({...d,ownerKind:'variable'})),...index.functions.filter(f=>f.parentFunction===null&&f.type==='FunctionDeclaration').map(f=>({name:f.name,initializerStart:f.start,initializerEnd:f.end,ownerKind:'function',topLevel:true,scopeFunction:null}))];
for(const d of owners){
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  if(!raw.includes('validationSchema:'))continue;
  if(raw.length>220000)continue;
  const c=parse(d);if(!c)continue;
  walk(c.node,n=>{
    if(n.type!=='ObjectExpression')return;
    const props=n.properties.filter(p=>p.type==='Property');
    const v=props.find(p=>propName(p,c)==='validationSchema');
    const init=props.find(p=>propName(p,c)==='initialValues');
    if(!v)return;
    const schemaAt=at(v.value,c);
    if(isYup(v.value,c)&&!inlineSchemaKeys.has(schemaAt)){
      inlineSchemaKeys.add(schemaAt);
      inlineFormSchemas.push({id:'inline-validation@'+schemaAt,owner:d.name,sourceStart:schemaAt,sourceEnd:c.offset+v.value.end,schema:describeSchema(v.value,c),confidence:'Exact inline frontend validationSchema prop; not a server contract.'});
    }
    if(!init)return;
    const ts=new Set(),ss=new Set();
    walk(init.value,a=>{if(a.type==='Identifier'&&templateNames.has(a.name))ts.add(a.name)});
    walk(v.value,a=>{if(a.type==='Identifier'&&schemaNames.has(a.name))ss.add(a.name)});
    if(!ts.size)return;
    const k=at(n,c);if(assocKeys.has(k))return;assocKeys.add(k);
    const resolvedSchemaIds=[];
    for(const name of ss){
      const candidates=schemas.filter(x=>x.name===name&&x.sourceStart<k&&(x.topLevel||x.scopeFunction===d.name));
      const local=candidates.filter(x=>!x.topLevel&&x.scopeFunction===d.name);
      const selected=(local.length?local:candidates).sort((a,b)=>b.sourceStart-a.sourceStart)[0];
      if(selected)resolvedSchemaIds.push(selected.id);
    }
    associations.push({owner:d.name,sourceStart:k,sourceEnd:c.offset+n.end,schemaExpression:text(v.value,c),schemaNames:[...ss],resolvedSchemaIds,inlineSchemaId:inlineSchemaKeys.has(schemaAt)?'inline-validation@'+schemaAt:null,templateNames:[...ts],initialValuesExpression:text(init.value,c),confidence:'Both validationSchema and initialValues occur in the same parsed props object. Resolved local schema IDs match the owning function; source expressions retain dynamic/aliased cases.'});
  });
}

const dtoLiterals=new Map();
const dtoRegex=/(["'])([A-Za-z_$][A-Za-z0-9_$]*DTO)\1/g;
for(const m of source.matchAll(dtoRegex)){
  if(!dtoLiterals.has(m[2]))dtoLiterals.set(m[2],[]);
  dtoLiterals.get(m[2]).push(m.index);
}
const dtoGuards=[];
const guardDecls=top.filter(d=>/^is(?:.*DTO|Produit.*|Personne.*|Client.*|Contrat.*|Devis.*|Projet.*|Referentiel.*|Interlocuteur.*|Entreprise.*|Contact.*|Assure.*|Beneficiaire.*)$/.test(d.name));
for(const d of guardDecls){
  const c=parse(d);if(!c)continue;
  const tests=[];
  walk(c.node,n=>{
    if(n.type!=='BinaryExpression'||!['===','==','!==','!='].includes(n.operator))return;
    let left=n.left,right=n.right;
    if(left.type==='Literal'){[left,right]=[right,left];}
    if(left.type==='ChainExpression')left=left.expression;
    if(left.type==='MemberExpression'&&key(left.property,c)==='type'&&right.type==='Literal')tests.push({operator:n.operator,expression:text(n,c),discriminator:right.value,sourceOffset:at(n,c)});
  });
  if(tests.length)dtoGuards.push({...loc(d),tests});
}
const discriminatorMaps=[];
for(const d of top){
  if(!['ObjectExpression','CallExpression'].includes(d.initializerType))continue;
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  if(raw.length>18000||(!/["'][A-Za-z_$][A-Za-z0-9_$]*DTO["']/.test(raw)&&!/^(TYPE_CLIENT|TYPE_PERSONNE|PersonneType|ClientType|ProduitType|DevisType|ProjetType|ContratType)$/.test(d.name)))continue;
  const c=parse(d);if(!c)continue;
  if(c.node.type==='ObjectExpression')discriminatorMaps.push({...loc(d),kind:'object-map',value:expr(c.node,c)});
  else if(c.node.type==='CallExpression'&&['ArrowFunctionExpression','FunctionExpression'].includes(c.node.callee.type)){
    const param=c.node.callee.params[0]?.name,members=[];
    walk(c.node.callee.body,n=>{if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.type==='Identifier'&&n.left.object.name===param&&n.right.type==='Literal')members.push({name:n.left.computed?key(n.left.property,c):n.left.property.name,value:n.right.value,sourceOffset:at(n,c)});});
    if(members.length)discriminatorMaps.push({...loc(d),kind:'compiled-discriminator-enum',members});
  }
}

const customYupMethods=[];
for(const m of source.matchAll(/\baddMethod\(/g)){
  try{
    const node=acorn.parseExpressionAt(source,m.index,{ecmaVersion:'latest',sourceType:'module'});
    if(node.type!=='CallExpression'||node.arguments[1]?.type!=='Literal'||typeof node.arguments[1].value!=='string'||!['FunctionExpression','ArrowFunctionExpression'].includes(node.arguments[2]?.type))continue;
    const c={code:source,offset:0};
    customYupMethods.push({method:node.arguments[1].value,schemaConstructor:text(node.arguments[0],c),definition:expr(node.arguments[2],c),sourceStart:node.start,sourceEnd:node.end,confidence:'Exact custom frontend Yup extension; not a server validation rule.'});
  }catch{}
}
const dtoTemplateTypes=[];
for(const d of declarations.filter(d=>/^TEMPLATE(?:\$|_|$)/.test(d.name))){
  const c=parse(d);if(!c)continue;
  walk(c.node,n=>{if(n.type==='Property'&&propName(n,c)==='type'&&n.value.type==='Literal'&&typeof n.value.value==='string')dtoTemplateTypes.push({template:d.name,value:n.value.value,sourceOffset:at(n,c),confidence:'Literal type field in a frontend initial-values template; accepted server discriminator not established by itself.'});});
}

const servicePrefixes=[];
for(const d of top){
  const raw=source.slice(d.initializerStart,d.initializerEnd);
  if(raw.length>1500||!raw.includes('getRunTimeVar(API_ENDPOINTS.URL_API_'))continue;
  const refs=[...raw.matchAll(/getRunTimeVar\(API_ENDPOINTS\.(URL_API_[A-Z_]+)\)/g)].map(m=>m[1]);
  if(refs.length)servicePrefixes.push({...loc(d),runtimeVariables:[...new Set(refs)],expression:raw,confidence:'Exact frontend service-base/prefix expression; environment-specific value may differ.'});
}

const write=(name,value)=>{const data=JSON.stringify(value,null,2)+'\n';if(name==='ui-validation-schemas.json')fs.writeFileSync(path.join(root,name+'.gz'),zlib.gzipSync(data,{level:9}));else fs.writeFileSync(path.join(root,name),data);};
write('enum-constants.json',{metadata,counts:{objects:enums.length,categories:new Set(enums.flatMap(e=>e.categories)).size},constants:enums});
write('ui-templates.json',{metadata,count:templates.length,templates});
write('ui-validation-schemas.json',{metadata,count:schemas.length,schemas,inlineFormSchemaCount:inlineFormSchemas.length,inlineFormSchemas,formTemplateAssociations:associations});
write('dto-discriminators.json',{metadata,literalCount:dtoLiterals.size,literals:[...dtoLiterals].map(([value,sourceOffsets])=>({value,sourceOffsets,evidence:'Exact DTO-like string literal; schema and accepted server usage require the surrounding client call.'})),discriminatorMaps,typeGuards:dtoGuards,templateTypeFields:dtoTemplateTypes});
write('ui-custom-validation-methods.json',{metadata,count:customYupMethods.length,methods:customYupMethods});
write('service-prefix-constants.json',{metadata,count:servicePrefixes.length,constants:servicePrefixes});
const summary={metadata,counts:{enumObjects:enums.length,codeCategories:new Set(enums.flatMap(e=>e.categories)).size,templates:templates.length,yupSchemas:schemas.length,inlineFormSchemas:inlineFormSchemas.length,customYupMethods:customYupMethods.length,formTemplateAssociations:associations.length,dtoLiteralTypes:dtoLiterals.size,discriminatorMaps:discriminatorMaps.length,typeGuardDefinitions:dtoGuards.length,templateTypeFields:dtoTemplateTypes.length,servicePrefixConstants:servicePrefixes.length,parseErrors:errors.length},methodology:['Consumed Acorn declaration/function index of the full public bundle.','Parsed selected initializer expressions only; no application code was executed.','Enum inventory includes named top-level object constants or compiled enum IIFEs containing literal CODE:CATEGORY server-style values.','Template inventory preserves exact default structures and references, excluding the editor toolbar/base-format constants.','Yup inventory includes named global and local direct schema builders and factories; chained method order, arguments and conditions are preserved.','Inline form validationSchema props are separately structured when directly built with Yup.','Custom Yup extensions are parsed from addMethod calls, without executing definitions.','Associations require validationSchema and initialValues in the same parsed props object.','DTO inventory separates observed string literals, discriminator maps, type-guard predicates, and template type fields.','No value inferred from a UI default or UI validator is labelled a server requirement.'],limitations:['Dynamic schemas created from server-provided metadata, code-list values returned by APIs and runtime feature choices are not recoverable statically.','Aliased/computed objects are preserved as references or expressions rather than executed.','Anonymous validators outside identifiable form-prop objects are not separately inventoried.','Enum inventory is scoped to CODE:CATEGORY code-bearing constants; untagged application enums and vendor/library enums are outside this file, except selected DTO discriminator maps.','The inventory is specific to the fetched hashed main bundle; additional app assets require a separate pass.'],errors};
write('schema-extraction-summary.json',summary);
console.log(JSON.stringify(summary.counts,null,2));

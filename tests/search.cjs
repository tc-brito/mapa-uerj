// Run with: node tests/search.cjs
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const fields={'#search':{value:''},'#year':{value:''},'#edition':{value:''}};
const context=vm.createContext({document:{querySelector:s=>fields[s]}});
const app=fs.readFileSync(path.join(root,'app.js'),'utf8').split('function actions(')[0];
vm.runInContext(app+'\nglobalThis.searchAPI={matches,questionKey,uniqueQuestions};',context);
const {matches,questionKey,uniqueQuestions}=context.searchAPI;
const sets={discursivo:JSON.parse(fs.readFileSync(path.join(root,'dados.json'),'utf8')),qualificacao:JSON.parse(fs.readFileSync(path.join(root,'qualificacao.json'),'utf8')).entries};
function find(data,query){fields['#search'].value=query;return uniqueQuestions(data.filter(matches));}
const keys=list=>Array.from(list,questionKey).sort();
for(const [type,data] of Object.entries(sets)){
 for(const queries of [['função quadrática','quadrática função','FUNCAO QUADRATICA','quadratica','parábola'],['função exponencial','exponencial função','FUNCAO EXPONENCIAL','exponencial'],['probabilidade','PROBABILIDADE','probabilidades']]){
  const expected=keys(find(data,queries[0]));assert.ok(expected.length,`${type}: ${queries[0]}`);
  for(const query of queries)assert.deepEqual(keys(find(data,query)),expected,`${type}: ${query}`);
  console.log(type,queries[0],expected.length);
 }
 assert.equal(find(data,'assuntoinexistente123').length,0);
 assert.equal(find(data,'').length,new Set(data.map(questionKey)).size);
 assert.deepEqual(keys(find(data,'2026 probabilidade')),keys(find(data,'probabilidade 2026')));
 fields['#year'].value='2026';assert.ok(find(data,'probabilidade').every(e=>e.year===2026));fields['#year'].value='';
}
const quad=find(sets.discursivo,'função quadrática');
assert.ok(quad.some(e=>e.year===2012&&e.number===4),'Quadratic braking model is included');
assert.ok(!quad.some(e=>e.year===2013&&e.number===1),'Exponential depreciation is not quadratic');
assert.ok(!quad.some(e=>e.year===2016&&e.number===7),'An affine question is not quadratic');
const expo=find(sets.discursivo,'função exponencial');
assert.ok(expo.some(e=>e.year===2015&&e.number===2),'Exponential topic outside its title is included');
assert.ok(!expo.some(e=>e.year===2020&&e.number===5),'Parabola is not exponential');
const probability=find(sets.qualificacao,'probabilidade');
assert.ok(!probability.some(e=>e.year===2027&&e.number===34),'Counting-only questions are not probability');
assert.ok(probability.some(e=>e.year===2026&&e.number===34),'Probability questions are included');
fields['#edition'].value='2º EQ';assert.ok(find(sets.qualificacao,'probabilidade').every(e=>e.edition==='2º EQ'));
console.log('Search regression checks passed.');

'use strict';
const $=s=>document.querySelector(s);
const discursiveShort=['Aritmética e raciocínio lógico','Funções e inequações','Geometria plana','Geometria espacial','Geometria analítica','Estatística descritiva','Probabilidade','Análise combinatória','Sequências, PA e PG','Porcentagem','Trigonometria','Polinômios','Matrizes e sistemas','Matemática financeira','Teoria dos conjuntos','Programação linear'];
let activeType='qualificacao', entries=[], cats=[], years=[], short=[], exams=[], selected, mode='map', zoom=1, openYears=new Set(),openQuestions=new Set();
const questionKey=e=>`${e.examId||'discursivo-'+e.year}-${e.number}`;
const editionName=e=>e.edition==='EU'?'Exame Único':(e.edition||'Exame discursivo');
const questionLabel=e=>`${e.edition?editionName(e)+' · ':''}QUESTÃO ${String(e.number).padStart(2,'0')}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Canonical subject terms keep word order, accents and common inflections out of the way.
function searchWords(text){
 return (norm(String(text)).match(/[a-z0-9]+/g)||[]).filter(w=>!['a','as','o','os','de','da','das','do','dos','e','em'].includes(w)).map(w=>{
  if(/^(funcao|funcoes)$/.test(w))return 'funcao';
  if(/^(questao|questoes)$/.test(w))return 'questao';
  if(/^(equacao|equacoes)$/.test(w))return 'equacao';
  if(/^(quadratic[ao]s?|parabolas?)$/.test(w))return 'quadratica';
  if(/^(exponencial|exponenciais)$/.test(w))return 'exponencial';
  if(/^(logaritmic[ao]s?|logaritmos?)$/.test(w))return 'logaritmo';
  if(/^probabilidades?$/.test(w))return 'probabilidade';
  return w;
 });
}
const searchIndex=new WeakMap();
function indexedWords(e){
 if(!searchIndex.has(e)){
  // Parenthetical lists describe an umbrella category, not every question in it.
  const category=e.category==='Probabilidade e Análise Combinatória'?'':e.category.replace(/\([^)]*\)/g,'');
  const words=searchWords([category,e.title,e.topics,e.year,editionName(e),'Questão '+String(e.number).padStart(2,'0'),'Questão '+e.number].join(' '));
  if(words.some(w=>['quadratica','exponencial','logaritmo','afim'].includes(w)))words.push('funcao');
  searchIndex.set(e,words);
 }
 return searchIndex.get(e);
}
function matches(e){
 const y=$('#year').value,edition=$('#edition').value,query=searchWords($('#search').value);
 return (!y||String(e.year)===y)&&(!edition||e.edition===edition)&&query.every(term=>indexedWords(e).some(word=>/^[0-9]+$/.test(term)?word===term:word.startsWith(term)));
}
function filtered(){return entries.filter(matches)}
function uniqueQuestions(data){
 const questions=new Map();
 for(const e of data){const key=questionKey(e),previous=questions.get(key);if(!previous||(previous.role.includes('secundário')&&!e.role.includes('secundário')))questions.set(key,e)}
 return [...questions.values()];
}
function actions(e){return `<div class="resource-actions"><a class="resource-link primary" href="${e.url}" target="_blank" rel="noopener" aria-label="Ver questão ${e.number} de ${editionName(e)} ${e.year}, página ${e.page}">Ver questão <span aria-hidden="true">↗</span><small>Página ${e.page} da prova</small></a><a class="resource-link answer" href="${e.answerUrl}" target="_blank" rel="noopener" aria-label="Ver gabarito da questão ${e.number} de ${editionName(e)} ${e.year}, página ${e.answerPage}">Ver gabarito <span aria-hidden="true">↗</span><small>Página ${e.answerPage} do gabarito</small></a></div>`}
function leaf(e){return `<section class="node detail" aria-label="Detalhamento da questão ${e.number} de ${e.year}"><span class="role">${e.role.includes('secundário')?'Conteúdo secundário · múltiplos conteúdos':'Conteúdo principal'}</span><p>${esc(e.topics)}</p>${e.cancelled?'<p class="cancelled">Questão anulada</p>':''}${actions(e)}<small class="pdf-note">PDFs abrem em outra aba.</small></section>`}
function render(){
 const data=filtered(),all=uniqueQuestions(data),visibleCats=cats.filter(c=>data.some(e=>e.category===c));
 if(selected!==null&&!visibleCats.includes(selected))selected=null;
 $('#categories').innerHTML=`<button class="cat all-content ${selected===null?'active':''}" data-cat="-1" aria-pressed="${selected===null}"><span>Todos os conteúdos</span><span class="count">${all.length}</span></button>`+cats.map((c,i)=>{const n=uniqueQuestions(data.filter(e=>e.category===c)).length;return `<button class="cat ${selected===c?'active':''}" data-cat="${i}" aria-pressed="${selected===c}" style="--accent:${['#146c65','#426684','#926621','#796190'][i%4]}" ${n?'':'hidden'}><span class="dot"></span><span>${short[i]}</span><span class="count">${n}</span></button>`}).join('');
 $('#category-select').innerHTML=`<option value="-1" ${selected===null?'selected':''}>Todos os conteúdos</option>`+visibleCats.map(c=>`<option value="${cats.indexOf(c)}" ${c===selected?'selected':''}>${esc(short[cats.indexOf(c)])}</option>`).join('');
 $('#category-select').disabled=!visibleCats.length;
 const list=selected===null?all:uniqueQuestions(data.filter(e=>e.category===selected));
 const searching=!!$('#search').value.trim(),title=selected===null?(searching?'Resultados da busca':'Todos os conteúdos'):short[cats.indexOf(selected)];
 $('#selected-title').textContent=title;
 $('#result-count').textContent=`${list.length} ${list.length===1?'questão':'questões'}${selected!==null?` de ${all.length} encontradas`:''} · ${activeType==='qualificacao'?'Qualificação':'Discursivo'}`;
 $('#show-all').hidden=selected===null;
 $('#show-all').textContent=`Exibir todos os resultados (${all.length})`;
 $('#clear-filters').disabled=!searching&&!$('#year').value&&!$('#edition').value&&selected===null;
 $('#map-view').hidden=mode!=='map';$('#list-view').hidden=mode!=='list';$('#reset').hidden=mode!=='map';
 $('#reset').disabled=!openYears.size&&!openQuestions.size;
 $('#map-tab').classList.toggle('active',mode==='map');$('#list-tab').classList.toggle('active',mode==='list');$('#map-tab').setAttribute('aria-pressed',mode==='map');$('#list-tab').setAttribute('aria-pressed',mode==='list');
 if(!list.length){$('#graph').innerHTML='<div class="empty">Nenhuma questão encontrada.<br>Tente outro assunto ou use Limpar filtros.</div>';$('#list-view').innerHTML=$('#graph').innerHTML;return;}
 const ys=[...new Set(list.map(e=>e.year))].sort((a,b)=>b-a);
 $('#graph').innerHTML=`<ul class="tree"><li><div class="node root">${esc(title)}</div><ul>${ys.map(y=>{const entries=list.filter(e=>e.year===y).sort((a,b)=>(a.edition||'').localeCompare(b.edition||'')||a.number-b.number), expanded=openYears.has(y);return `<li><button class="node year" data-year="${y}" aria-expanded="${expanded}">${y}<small>${entries.length} ${entries.length===1?'questão':'questões'} ${expanded?'−':'+'}</small></button>${expanded?`<ul>${entries.map(e=>{const key=questionKey(e),expandedQ=openQuestions.has(key);return `<li><button class="node question ${e.role.includes('secundário')?'secondary':''}" data-q="${key}" aria-expanded="${expandedQ}"><b>${esc(questionLabel(e))} ${expandedQ?'−':'+'}</b>${esc(e.title)}</button>${expandedQ?`<ul><li>${leaf(e)}</li></ul>`:''}</li>`}).join('')}</ul>`:''}</li>`}).join('')}</ul></li></ul>`;
 $('#list-view').innerHTML=[...list].sort((a,b)=>b.year-a.year||(a.edition||'').localeCompare(b.edition||'')||a.number-b.number).map(e=>`<article class="result"><div class="meta">${e.year} · ${esc(questionLabel(e))} · ${e.role.includes('secundário')?'CONTEÚDO SECUNDÁRIO':'CONTEÚDO PRINCIPAL'}</div>${selected===null?`<p class="result-category">${esc(short[cats.indexOf(e.category)])}</p>`:''}<h3>${esc(e.title)}</h3><p>${esc(e.topics)}</p>${e.cancelled?'<p class="cancelled">Questão anulada</p>':''}${actions(e)}</article>`).join('');applyZoom();
}
const mobile=window.matchMedia('(max-width: 760px)');
function applyZoom(){ $('#graph').style.zoom=mobile.matches?1:zoom;$('#zoom-label').textContent=Math.round(zoom*100)+'%'; }
function selectCategory(index){selected=Number(index)===-1?null:cats[Number(index)];openYears.clear();openQuestions.clear();zoom=1;render();$('#viewport').scrollTo(0,0)}
$('#categories').addEventListener('click',ev=>{const b=ev.target.closest('[data-cat]');if(b)selectCategory(b.dataset.cat)});
$('#category-select').addEventListener('change',ev=>selectCategory(ev.target.value));
mobile.addEventListener('change',applyZoom);
$('#graph').addEventListener('click',ev=>{const y=ev.target.closest('[data-year]'),q=ev.target.closest('[data-q]');if(y){const key=Number(y.dataset.year);openYears.has(key)?openYears.delete(key):openYears.add(key)}if(q){const key=q.dataset.q;openQuestions.has(key)?openQuestions.delete(key):openQuestions.add(key)}if(y||q){render(); const selector=y?`[data-year="${y.dataset.year}"]`:`[data-q="${q.dataset.q}"]`;const replacement=$('#graph').querySelector(selector);replacement?.focus({preventScroll:true})}});
$('#map-tab').onclick=()=>{mode='map';render()};$('#list-tab').onclick=()=>{mode='list';render()};
function filterChanged(){selected=null;openQuestions.clear();openYears=new Set(filtered().map(e=>e.year));render()}
$('#search').addEventListener('input',filterChanged);$('#year').addEventListener('change',filterChanged);$('#edition').addEventListener('change',filterChanged);
$('#reset').onclick=()=>{openYears.clear();openQuestions.clear();render();$('#viewport').scrollTo(0,0)};
$('#show-all').onclick=()=>selectCategory(-1);
$('#clear-filters').onclick=()=>{selected=null;$('#year').value='';$('#edition').value='';$('#search').value='';openYears=new Set([years[0]]);openQuestions.clear();zoom=1;render();$('#viewport').scrollTo(0,0)};
$('#plus').onclick=()=>{zoom=Math.min(1.3,zoom+.1);applyZoom()};$('#minus').onclick=()=>{zoom=Math.max(.4,zoom-.1);applyZoom()};$('#fit').onclick=()=>{const g=$('#graph'),v=$('#viewport');zoom=1;applyZoom();zoom=Math.max(.4,Math.min(1,(v.clientWidth-20)/g.scrollWidth,(v.clientHeight-20)/g.scrollHeight));applyZoom();v.scrollTo(0,0)};

function switchExam(type){
 activeType=type;
 entries=type==='qualificacao'?QUALIFICATION.entries:ENTRIES;
 cats=[...new Set(entries.map(e=>e.category))];
 short=type==='discursivo'?discursiveShort:cats;
 years=[...new Set(entries.map(e=>e.year))].sort((a,b)=>b-a);
 exams=type==='qualificacao'?QUALIFICATION.exams:years.map(year=>({year,url:`provas/uerj-${year}.pdf`,answerUrl:`gabaritos/uerj-${year}-gabarito.pdf`}));
 selected=cats[0];openYears=new Set([years[0]]);openQuestions.clear();zoom=1;
 $('#search').value='';$('#year').innerHTML='<option value="">Todos os anos</option>'+years.map(y=>`<option>${y}</option>`).join('');
 $('#edition').value='';$('#edition').hidden=type==='discursivo';
 document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b.dataset.type===type);b.setAttribute('aria-pressed',b.dataset.type===type)});
 const count=new Set(entries.map(questionKey)).size;
 $('.stats').innerHTML=`<div><strong>${count}</strong><span>questões</span></div><div><strong>${cats.length}</strong><span>conteúdos</span></div><div><strong>${exams.length}</strong><span>provas</span></div>`;
 $('.aside-title span').textContent=cats.length;
 $('#exam-context').textContent=type==='qualificacao'?'1º e 2º exames de qualificação · inclui os exames únicos de 2021 a 2023.':'Questões discursivas de Matemática.';
 render();$('#viewport').scrollTo(0,0);
}
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>switchExam(b.dataset.type)));

// A biblioteca reúne o acervo completo; os filtros acima pertencem ao mapa.
function renderLibrary(){
 const discursiveYears=[...new Set(ENTRIES.map(e=>e.year))];
 const library=[...QUALIFICATION.exams,...discursiveYears.map(year=>({
  year,edition:'discursivo',url:`provas/uerj-${year}.pdf`,answerUrl:`gabaritos/uerj-${year}-gabarito.pdf`
 }))];
 const libraryYears=[...new Set(library.map(e=>e.year))].sort((a,b)=>b-a);
 const names={'1º EQ':'1º EQ','2º EQ':'2º EQ','EU':'Exame Único','discursivo':'Exame Discursivo'};
 const order={'1º EQ':0,'2º EQ':1,'EU':0,'discursivo':2};
 $('#library-context').textContent=`${libraryYears.at(-1)}–${libraryYears[0]}`;
 $('#exams').innerHTML=libraryYears.map(year=>{
  const editions=library.filter(e=>e.year===year).sort((a,b)=>order[a.edition]-order[b.edition]);
  return `<article class="year-group" aria-labelledby="library-year-${year}">
   <h3 id="library-year-${year}">${year}</h3>
   <ul class="edition-list">${editions.map(e=>`<li class="edition-row">
    <span class="edition-name">${names[e.edition]}</span>
    <a class="edition-link" href="${e.url}" target="_blank" rel="noopener noreferrer" aria-label="Prova — ${names[e.edition]} ${year} (PDF, abre em outra aba)">Prova</a>
    <a class="edition-link" href="${e.answerUrl}" target="_blank" rel="noopener noreferrer" aria-label="Gabarito — ${names[e.edition]} ${year} (PDF, abre em outra aba)">Gabarito</a>
   </li>`).join('')}</ul>
  </article>`;
 }).join('');
}
renderLibrary();
switchExam(activeType);

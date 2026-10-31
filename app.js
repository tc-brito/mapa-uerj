'use strict';
const $=s=>document.querySelector(s);
const discursiveShort=['Aritmética e raciocínio lógico','Funções e inequações','Geometria plana','Geometria espacial','Geometria analítica','Estatística descritiva','Probabilidade','Análise combinatória','Sequências, PA e PG','Porcentagem','Trigonometria','Polinômios','Matrizes e sistemas','Matemática financeira','Teoria dos conjuntos','Programação linear'];
let activeType='qualificacao', entries=[], cats=[], years=[], short=[], exams=[], selected, mode='map', zoom=1, openYears=new Set(),openQuestions=new Set();
const questionKey=e=>`${e.examId||'discursivo-'+e.year}-${e.number}`;
const editionName=e=>e.edition==='EU'?'Exame Único':(e.edition||'Exame discursivo');
const questionLabel=e=>`${e.edition?editionName(e)+' · ':''}QUESTÃO ${String(e.number).padStart(2,'0')}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function matches(e){const y=$('#year').value,edition=$('#edition').value,q=norm($('#search').value.trim());return (!y||String(e.year)===y)&&(!edition||e.edition===edition)&&(!q||norm([e.category,e.title,e.topics,e.year,editionName(e),'Questão '+String(e.number).padStart(2,'0'),'Questão '+e.number].join(' ')).includes(q));}
function filtered(){return entries.filter(matches)}
function actions(e){return `<div class="resource-actions"><a class="resource-link primary" href="${e.url}" target="_blank" rel="noopener" aria-label="Ver questão ${e.number} de ${editionName(e)} ${e.year}, página ${e.page}">Ver questão <span aria-hidden="true">↗</span><small>Página ${e.page} da prova</small></a><a class="resource-link answer" href="${e.answerUrl}" target="_blank" rel="noopener" aria-label="Ver gabarito da questão ${e.number} de ${editionName(e)} ${e.year}, página ${e.answerPage}">Ver gabarito <span aria-hidden="true">↗</span><small>Página ${e.answerPage} do gabarito</small></a></div>`}
function leaf(e){return `<section class="node detail" aria-label="Detalhamento da questão ${e.number} de ${e.year}"><span class="role">${e.role.includes('secundário')?'Conteúdo secundário · múltiplos conteúdos':'Conteúdo principal'}</span><p>${esc(e.topics)}</p>${e.cancelled?'<p class="cancelled">Questão anulada</p>':''}${actions(e)}<small class="pdf-note">PDFs abrem em outra aba.</small></section>`}
function render(){
 const data=filtered();const visibleCats=cats.filter(c=>data.some(e=>e.category===c));
 if(!visibleCats.includes(selected)&&visibleCats.length)selected=visibleCats[0];
 $('#categories').innerHTML=cats.map((c,i)=>{const n=data.filter(e=>e.category===c).length;return `<button class="cat ${selected===c?'active':''}" data-cat="${i}" aria-pressed="${selected===c}" style="--accent:${['#146c65','#426684','#926621','#796190'][i%4]}" ${n?'':'hidden'}><span class="dot"></span><span>${short[i]}</span><span class="count">${n}</span></button>`}).join('');
 $('#category-select').innerHTML=visibleCats.map(c=>`<option value="${cats.indexOf(c)}" ${c===selected?'selected':''}>${esc(short[cats.indexOf(c)])}</option>`).join('');
 $('#category-select').disabled=!visibleCats.length;
 const list=data.filter(e=>e.category===selected);$('#selected-title').textContent=selected;$('#result-count').textContent=`${list.length} ${list.length===1?'questão neste conteúdo':'questões neste conteúdo'} · ${new Set(data.map(questionKey)).size} ${new Set(data.map(questionKey)).size===1?'questão encontrada':'questões encontradas'} no total`;
 $('#map-view').hidden=mode!=='map';$('#list-view').hidden=mode!=='list';$('#reset').hidden=mode!=='map';
 $('#map-tab').classList.toggle('active',mode==='map');$('#list-tab').classList.toggle('active',mode==='list');$('#map-tab').setAttribute('aria-pressed',mode==='map');$('#list-tab').setAttribute('aria-pressed',mode==='list');
 if(!list.length){$('#graph').innerHTML='<div class="empty">Nenhuma questão encontrada.<br>Tente outro termo ou outra edição.</div>';$('#list-view').innerHTML=$('#graph').innerHTML;return;}
 const ys=[...new Set(list.map(e=>e.year))].sort((a,b)=>b-a);const searching=!!$('#search').value.trim();
 $('#graph').innerHTML=`<ul class="tree"><li><div class="node root">${esc(short[cats.indexOf(selected)])}</div><ul>${ys.map(y=>{const entries=list.filter(e=>e.year===y).sort((a,b)=>(a.edition||'').localeCompare(b.edition||'')||a.number-b.number), expanded=openYears.has(y);return `<li><button class="node year" data-year="${y}" aria-expanded="${expanded}">${y}<small>${entries.length} ${entries.length===1?'questão':'questões'} ${expanded?'−':'+'}</small></button>${expanded?`<ul>${entries.map(e=>{const key=questionKey(e),expandedQ=openQuestions.has(key);return `<li><button class="node question ${e.role.includes('secundário')?'secondary':''}" data-q="${key}" aria-expanded="${expandedQ}"><b>${esc(questionLabel(e))} ${expandedQ?'−':'+'}</b>${esc(e.title)}</button>${expandedQ?`<ul><li>${leaf(e)}</li></ul>`:''}</li>`}).join('')}</ul>`:''}</li>`}).join('')}</ul></li></ul>`;
 $('#list-view').innerHTML=[...list].sort((a,b)=>b.year-a.year||(a.edition||'').localeCompare(b.edition||'')||a.number-b.number).map(e=>`<article class="result"><div class="meta">${e.year} · ${esc(questionLabel(e))} · ${e.role.includes('secundário')?'CONTEÚDO SECUNDÁRIO':'CONTEÚDO PRINCIPAL'}</div><h3>${esc(e.title)}</h3><p>${esc(e.topics)}</p>${e.cancelled?'<p class="cancelled">Questão anulada</p>':''}${actions(e)}</article>`).join('');applyZoom();
}
const mobile=window.matchMedia('(max-width: 760px)');
function applyZoom(){ $('#graph').style.zoom=mobile.matches?1:zoom;$('#zoom-label').textContent=Math.round(zoom*100)+'%'; }
function selectCategory(index){selected=cats[Number(index)];openYears.clear();openQuestions.clear();zoom=1;render();$('#viewport').scrollTo(0,0)}
$('#categories').addEventListener('click',ev=>{const b=ev.target.closest('[data-cat]');if(b)selectCategory(b.dataset.cat)});
$('#category-select').addEventListener('change',ev=>selectCategory(ev.target.value));
mobile.addEventListener('change',applyZoom);
$('#graph').addEventListener('click',ev=>{const y=ev.target.closest('[data-year]'),q=ev.target.closest('[data-q]');if(y){const key=Number(y.dataset.year);openYears.has(key)?openYears.delete(key):openYears.add(key)}if(q){const key=q.dataset.q;openQuestions.has(key)?openQuestions.delete(key):openQuestions.add(key)}if(y||q){render(); const selector=y?`[data-year="${y.dataset.year}"]`:`[data-q="${q.dataset.q}"]`;const replacement=$('#graph').querySelector(selector);replacement?.focus({preventScroll:true})}});
$('#map-tab').onclick=()=>{mode='map';render()};$('#list-tab').onclick=()=>{mode='list';render()};
function filterChanged(){openQuestions.clear();openYears=new Set(filtered().map(e=>e.year));render()}
$('#search').addEventListener('input',filterChanged);$('#year').addEventListener('change',filterChanged);$('#edition').addEventListener('change',filterChanged);
$('#reset').onclick=()=>{openYears.clear();openQuestions.clear();$('#year').value='';$('#edition').value='';$('#search').value='';zoom=1;render();$('#viewport').scrollTo(0,0)};
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
 $('#library-context').textContent=type==='qualificacao'?'Qualificação e Exame Único · 2012–2027':'Exame discursivo · 2012–2020 e 2024–2026';
 $('#exams').innerHTML=[...exams].sort((a,b)=>b.year-a.year||(a.edition||'').localeCompare(b.edition||'')).map(e=>`<article class="exam"><div class="exam-title"><b>${e.year}</b><small>${editionName(e)}</small></div><div class="exam-links"><a href="${e.url}" target="_blank" rel="noopener" aria-label="Abrir prova de ${editionName(e)} ${e.year}">Prova <span aria-hidden="true">↗</span></a><a href="${e.answerUrl}" target="_blank" rel="noopener" aria-label="Abrir gabarito de ${editionName(e)} ${e.year}">Gabarito <span aria-hidden="true">↗</span></a></div></article>`).join('');
 render();$('#viewport').scrollTo(0,0);
}
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>switchExam(b.dataset.type)));
switchExam(activeType);
